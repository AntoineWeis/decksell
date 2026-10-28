// Import des listes de tournoi Modern récentes (référence du score de proximité méta), puis
// recalcul du score de toutes les annonces. Méthode : docs/score-meta.md.
//
// Source unique : résultats officiels MTGO (mtgo.com/decklists), publiés par Wizards.
// Modern Challenges (avec classement) et Modern Leagues (listes 5-0), en données structurées.
// Choix du risque légal le plus faible : données publiques de l'éditeur du jeu, aucune lecture
// de HTML de site tiers. Incrémental : seuls les événements pas encore importés sont lus.
//
// Usage : npm run import:meta                    (fenêtre de 30 jours, puis recalcul des annonces)
//         npm run import:meta -- --days 45
//         npm run import:meta -- --dry-run       (lit la source, n'écrit rien)
//         npm run import:meta -- --only-rescore  (recalcule les annonces sans rien importer)

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { formatDecklist, parseDecklist } from "../src/lib/decklist.ts";
import { buildEstimate, coverCard, lookupNames } from "../src/lib/pricing.ts";
import { fetchCardPrices } from "../src/lib/price-lookup.ts";
import { META_WINDOW_DAYS } from "../src/lib/meta-config.ts";
import { boardSize, compareDecks } from "../src/lib/similarity.ts";
import { buildCorpus, deckCardsFromParsed } from "../src/lib/meta-match.ts";
import { classifyArchetype } from "../src/lib/archetype-signatures.ts";
import { metaColumns, saveListingMeta, scoreDecklist } from "../src/lib/meta-score.ts";
import { refreshBadges } from "../src/lib/badge-stats.ts";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback;
};
const DAYS = option("days", META_WINDOW_DAYS);
const DRY = flag("dry-run");
const UA = "decksell/1.0 (+https://decksell.fr ; import quotidien des resultats Modern)";
const DELAY_MS = 500; // départs de requêtes espacés d'au moins 0,5 s
const PARALLEL = 3;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("ECHEC : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY sont requis (.env.local).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const since = new Date(Date.now() - DAYS * 86_400_000);
const sinceIso = since.toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastFetch = 0;

/** Requête polie : identifiée, espacée, 45 s d'attente (certaines pages MTGO sont lentes), une seconde tentative. */
async function fetchText(target) {
  for (let attempt = 1; ; attempt++) {
    const start = Math.max(Date.now(), lastFetch + DELAY_MS);
    lastFetch = start;
    if (start > Date.now()) await sleep(start - Date.now());
    try {
      // Accept : sans lui, MTGO renvoie la page des résultats sans la liste des événements
      // (constaté le 25/10/2026). L'identité « decksell » reste la même.
      const res = await fetch(target, {
        headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.8" },
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) throw new Error(`${res.status} sur ${target}`);
      return await res.text();
    } catch (e) {
      if (attempt >= 2) throw e;
      await sleep(2000);
    }
  }
}

/** Applique fn à chaque élément, au plus `limit` à la fois. */
async function eachLimit(items, limit, fn) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (queue.length) await fn(queue.shift());
    }),
  );
}

const eventUrl = (slug) => `https://www.mtgo.com/decklist/${slug}`;
const slugDate = (slug) => {
  const m = slug.match(/-(\d{4})-(\d{2})-(\d{2})\d*$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

/** Liste MTGO → ligne de meta_decks, ou null si la liste est inexploitable (principal < 40 cartes). */
function toRecord(base, parsed, archetypeNames) {
  const cards = deckCardsFromParsed(parsed);
  const mainCount = boardSize(cards.main);
  if (mainCount < 40) return null;
  const sorted = (m) => [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, q]) => `${q} ${k}`).join("|");
  const slug = classifyArchetype(cards);
  return {
    ...base,
    archetype: slug ? (archetypeNames.get(slug) ?? null) : null,
    archetype_inferred: true,
    decklist: formatDecklist(parsed),
    main: Object.fromEntries(cards.main),
    side: Object.fromEntries(cards.side),
    names: Object.fromEntries(cards.names),
    main_count: mainCount,
    side_count: boardSize(cards.side),
    fingerprint: createHash("sha1").update(`${base.event_date}#${sorted(cards.main)}#${sorted(cards.side)}`).digest("hex"),
  };
}

/** Cartes d'une liste MTGO (JSON) : nom → quantité, quantités invalides ignorées. */
function entries(cards) {
  const out = new Map();
  for (const c of cards ?? []) {
    const name = c.card_attributes?.card_name;
    const qty = Number(c.qty);
    if (!name || !Number.isInteger(qty) || qty < 1 || qty > 99) continue;
    out.set(name, (out.get(name) ?? 0) + qty);
  }
  return [...out].map(([name, quantity]) => ({ name, quantity }));
}

/** Enregistre un paquet de listes (doublons d'empreinte ignorés). */
async function save(records, seenPrints) {
  const fresh = records.filter((r) => !seenPrints.has(r.fingerprint) && seenPrints.add(r.fingerprint));
  if (fresh.length === 0 || DRY) return fresh.length;
  const { error } = await db.from("meta_decks").upsert(fresh, { onConflict: "source,source_id", ignoreDuplicates: true });
  if (error) throw new Error(`Enregistrement impossible : ${error.message}`);
  return fresh.length;
}

async function importMtgo() {
  // Noms des archétypes Modern (table archetypes), pour nommer les listes.
  const { data: archetypes } = await db.from("archetypes").select("slug, name").eq("format", "modern");
  const archetypeNames = new Map((archetypes ?? []).map((a) => [a.slug, a.name]));

  // Déjà importés : événements (par adresse) et empreintes, pour ne relire que le nouveau.
  const { data: existing, error } = await db.from("meta_decks").select("source_url, fingerprint").gte("event_date", sinceIso);
  if (error && !DRY) throw new Error(`Lecture de meta_decks impossible : ${error.message} (exécute supabase/schema.sql)`);
  const doneEvents = new Set((existing ?? []).map((r) => r.source_url));
  const seenPrints = new Set((existing ?? []).map((r) => r.fingerprint));

  // Événements Modern des mois couverts par la fenêtre.
  const months = new Set();
  for (let d = new Date(since); d <= new Date(); d.setUTCMonth(d.getUTCMonth() + 1)) {
    months.add(`${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  months.add(new Date().toISOString().slice(0, 7).replace("-", "/"));
  const slugs = new Set();
  for (const m of months) {
    const html = await fetchText(`https://www.mtgo.com/decklists/${m}`);
    for (const [, slug] of html.matchAll(/href="\/decklist\/(modern-[a-z0-9-]+)"/g)) slugs.add(slug);
  }
  if (slugs.size === 0) throw new Error("Aucun événement trouvé : la page MTGO a peut-être changé de structure.");
  const todo = [...slugs].filter((s) => (slugDate(s) ?? "") >= sinceIso && !doneEvents.has(eventUrl(s)));
  console.log(`MTGO : ${slugs.size} événements Modern trouvés, ${todo.length} nouveaux à lire.`);

  let read = 0;
  let saved = 0;
  let pending = [];
  const flush = async () => {
    const batch = pending;
    pending = [];
    saved += await save(batch, seenPrints);
  };
  await eachLimit(todo, PARALLEL, async (slug) => {
    // Serveur chargé : la page arrive parfois sans les listes. Deux nouvelles tentatives espacées ;
    // sinon l'événement est simplement relu au prochain import (il n'est pas marqué comme importé).
    let data;
    for (let attempt = 1; !data; attempt++) {
      try {
        const html = await fetchText(eventUrl(slug));
        const m = html.match(/window\.MTGO\.decklists\.data\s*=\s*(\{[\s\S]*?\});\s*\n/);
        if (!m) throw new Error("données absentes de la page");
        data = JSON.parse(m[1]);
      } catch (e) {
        if (attempt >= 3) {
          console.warn(`  ${slug} reporté au prochain import (${e.message})`);
          return;
        }
        await sleep(4000 * attempt);
      }
    }
    if (!Array.isArray(data.decklists) || data.decklists.length === 0) return; // listes pas encore publiées : relu demain
    const ranks = new Map((data.final_rank ?? []).map((r) => [String(r.loginid), String(r.rank)]));
    const isLeague = /league/i.test(slug);
    for (const d of data.decklists) {
      const rec = toRecord(
        {
          source: "mtgo",
          source_id: String(d.decktournamentid ?? `${data.event_id}-${d.loginid}`),
          event_name: data.description ?? slug,
          event_date: slugDate(slug),
          placement: isLeague ? "5-0" : (ranks.get(String(d.loginid)) ?? null),
          player: d.player ?? null,
          source_url: eventUrl(slug),
        },
        { main: entries(d.main_deck), side: entries(d.sideboard_deck) },
        archetypeNames,
      );
      if (rec) pending.push(rec);
    }
    if (++read % 10 === 0) {
      await flush();
      console.log(`  ${read} / ${todo.length} événements lus, ${saved} listes enregistrées…`);
    }
  });
  await flush();
  console.log(`MTGO : ${read} événements lus, ${saved} nouvelles listes${DRY ? " (simulation)" : ""}.`);

  if (!DRY) {
    const { error: pruneError, count } = await db.from("meta_decks").delete({ count: "exact" }).lt("event_date", sinceIso);
    if (pruneError) throw new Error(`Nettoyage impossible : ${pruneError.message}`);
    if (count) console.log(`Listes de plus de ${DAYS} jours retirées : ${count}.`);
  }
}

/** Corpus de la fenêtre, lu par paquets de 1 000. */
async function loadCorpus() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("meta_decks")
      .select("id, source, event_name, event_date, placement, player, archetype, source_url, main, side, names")
      .gte("event_date", sinceIso)
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(`Lecture du corpus impossible : ${error.message}`);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

/**
 * Renomme toute la fenêtre avec les cartes types actuelles (calcul local, rapide) : une
 * modification de archetype-signatures.ts s'applique aussi aux listes déjà importées.
 */
async function reclassify(rows) {
  const { data: archetypes } = await db.from("archetypes").select("slug, name").eq("format", "modern");
  const names = new Map((archetypes ?? []).map((a) => [a.slug, a.name]));
  const changes = [];
  for (const r of rows) {
    const slug = classifyArchetype(buildCorpus([r]).cards[0]);
    const archetype = slug ? (names.get(slug) ?? null) : null;
    if (archetype !== r.archetype) {
      changes.push({ id: r.id, archetype });
      r.archetype = archetype;
    }
  }
  for (const c of changes) {
    const { error } = await db.from("meta_decks").update({ archetype: c.archetype, archetype_inferred: true }).eq("id", c.id);
    if (error) throw new Error(`Renommage impossible : ${error.message}`);
  }
  if (changes.length) console.log(`Archétypes renommés : ${changes.length} listes.`);
}

/** Calibration : score de chaque liste nommée avec sa plus proche voisine, du même archétype ou non. */
function calibration(rows) {
  const named = rows.filter((r) => r.archetype);
  console.log(`Archétypes reconnus : ${named.length} / ${rows.length} listes.`);
  if (named.length < 20) return;
  const step = Math.max(1, Math.ceil(named.length / 400));
  const sample = named.filter((_, i) => i % step === 0);
  const corpus = buildCorpus(rows);
  const index = new Map(rows.map((r, i) => [r.id, i]));
  const same = [];
  const other = [];
  for (const r of sample) {
    const a = corpus.cards[index.get(r.id)];
    let bestSame = 0;
    let bestOther = 0;
    for (const o of named) {
      if (o.id === r.id) continue;
      const s = compareDecks(a, corpus.cards[index.get(o.id)], corpus.weights).score;
      if (o.archetype === r.archetype) bestSame = Math.max(bestSame, s);
      else bestOther = Math.max(bestOther, s);
    }
    same.push(bestSame);
    other.push(bestOther);
  }
  const q = (a, p) => [...a].sort((x, y) => x - y)[Math.floor(p * (a.length - 1))];
  const line = (a) => `médiane ${q(a, 0.5)}, 10 % ${q(a, 0.1)}, 90 % ${q(a, 0.9)}`;
  console.log(`Calibration — plus proche du même archétype : ${line(same)} ; d'un autre archétype : ${line(other)}.`);
}

async function rescoreListings(rows) {
  const corpus = buildCorpus(rows);
  // Decks Modern seulement : le score compare aux listes de tournoi Modern.
  const { data: listings, error } = await db.from("listings").select("id, title, decklist").eq("format", "modern");
  if (error) throw new Error(`Lecture des annonces impossible : ${error.message}`);
  for (const l of listings) {
    const result = await scoreDecklist(db, l.decklist, corpus);
    const cols = metaColumns(result);
    const label =
      result.status === "invalid"
        ? result.reason
        : result.status === "empty"
          ? "corpus vide"
          : `${result.score} (${result.best.deck.archetype ?? "non nommé"})`;
    console.log(`  « ${l.title} » : ${label}`);
    if (!cols || DRY) continue;
    const e = await saveListingMeta(db, l.id, cols);
    if (e) throw new Error(`Mise à jour de l'annonce ${l.id} impossible : ${e}`);
  }
}

/**
 * Image du deck des annonces qui n'en ont pas (publiées avant son enregistrement) : calculée ici,
 * une fois, et non plus à l'affichage des pages publiques (qui ne font que lire).
 */
async function fillMissingCovers() {
  const { data, error } = await db.from("listings").select("id, decklist, commanders").is("cover_image_url", null).limit(500);
  if (error) throw new Error(`Lecture des annonces sans image impossible : ${error.message}`);
  let filled = 0;
  for (const l of data) {
    const deck = parseDecklist(l.decklist);
    const card = coverCard(buildEstimate(deck, await fetchCardPrices(db, lookupNames(deck))), l.commanders ?? deck.commanders);
    if (!card?.imageUrl) continue;
    const { error: e } = await db
      .from("listings")
      .update({ cover_card_name: card.name, cover_image_url: card.imageUrl })
      .eq("id", l.id)
      .is("cover_image_url", null);
    if (!e) filled++;
  }
  if (data.length > 0) console.log(`Images de deck : ${filled} ajoutée${filled > 1 ? "s" : ""} sur ${data.length} annonce${data.length > 1 ? "s" : ""} sans image.`);
}

/** Badges de tous les membres qui ont publié : l'ancienneté et la réactivité évoluent sans action. */
async function refreshAllBadges() {
  const { data, error } = await db.from("listings").select("seller_id");
  if (error) throw new Error(`Lecture des vendeurs impossible : ${error.message}`);
  const sellers = [...new Set(data.map((l) => l.seller_id))];
  let earned = 0;
  for (const id of sellers) earned += (await refreshBadges(db, id)).length;
  console.log(`Badges : ${sellers.length} membres vérifiés, ${earned} badge${earned > 1 ? "s" : ""} gagné${earned > 1 ? "s" : ""}.`);
}

const started = Date.now();
console.log(`Import méta Modern (MTGO) depuis le ${sinceIso}${DRY ? " (simulation, rien n'est écrit)" : ""}.`);
try {
  if (!flag("only-rescore")) await importMtgo();
  if (DRY) {
    console.log("Simulation : pas de recalcul des annonces.");
  } else {
    const rows = await loadCorpus();
    console.log(`Corpus : ${rows.length} listes de référence.`);
    await reclassify(rows);
    calibration(rows);
    await rescoreListings(rows);
    await fillMissingCovers();
    await refreshAllBadges();
  }
  console.log(`Terminé en ${Math.round((Date.now() - started) / 1000)} s.`);
} catch (e) {
  console.error("ECHEC :", e.message);
  process.exit(1);
}
