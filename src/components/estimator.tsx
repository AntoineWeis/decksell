"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { bracketAction, estimateAction, importDeckAction, type BracketState, type EstimateState } from "@/app/actions";
import { formatDecklist, isCommander, normalizeName, withFormat, type DetectedFormat, type ParsedDeck } from "@/lib/decklist";
import { BracketCard } from "./bracket-card";
import { buildEstimate, formatEur, parseEur, type Estimate, type ManualPrices, type PricedLine } from "@/lib/pricing";
import { SAMPLE_DECK } from "@/lib/sample-deck";
import type { Archetype } from "@/lib/listings";
import { CardList } from "./card-list";
import { SellPanel } from "./sell-panel";
import { CountUp } from "./count-up";
import { TiltCard } from "./tilt";
import { EstimateSkeleton } from "./deck-skeleton";

const DRAFT_KEY = "decksell:draft";

// Bandeau : illustration de carte (Scryfall), floutée comme l'en-tête d'une page de deck.
const BANNER_ART =
  "https://cards.scryfall.io/art_crop/front/8/d/8d74a469-c71d-4773-99d3-5456b31df424.jpg?1783937526";
const BANNER_CREDIT = "Emrakul, the Promised End, par Jaime Jones";

// Identifiant stable par estimation reçue : relance l'animation d'ouverture à chaque nouveau paquet,
// mais pas quand on tape un prix à la main.
const revealIds = new WeakMap<object, number>();
let revealCounter = 0;
function revealId(o: object) {
  if (!revealIds.has(o)) revealIds.set(o, ++revealCounter);
  return revealIds.get(o)!;
}

export function Estimator({ archetypes }: { archetypes: Archetype[] }) {
  const [text, setText] = useState("");
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});
  const [state, formAction, pending] = useActionState<EstimateState, FormData>(estimateAction, { status: "idle" });
  const [importUrl, setImportUrl] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, startImport] = useTransition();

  function importFromUrl() {
    if (!importUrl.trim()) return;
    setImportError(null);
    startImport(async () => {
      const r = await importDeckAction(importUrl);
      if (r.status === "ok") {
        setText(r.text);
        setImportUrl("");
      } else setImportError(r.message);
    });
  }

  // Brouillon gardé dans l'onglet : la liste survit à un passage par la page de connexion.
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(DRAFT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique au chargement
      if (draft) setText(draft);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (text) sessionStorage.setItem(DRAFT_KEY, text);
      else sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, [text]);

  // Sur une colonne, on amène le résultat à l'écran.
  useEffect(() => {
    if (state.status === "ok" && window.innerWidth < 1024) {
      document.getElementById("resultat")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state]);

  const manual = useMemo(() => {
    const out: ManualPrices = {};
    for (const [key, raw] of Object.entries(manualInputs)) {
      const cents = parseEur(raw);
      if (cents != null) out[key] = cents;
    }
    return out;
  }, [manualInputs]);

  // Format et commandant(s) : ceux lus dans la liste, jusqu'à ce que le vendeur les change.
  // Le choix est rattaché à l'estimation reçue : une nouvelle estimation repart de la détection.
  const [choice, setChoice] = useState<{ for: object; format: DetectedFormat; commanders: string[] } | null>(null);
  const deck = useMemo<ParsedDeck | null>(() => {
    if (state.status !== "ok") return null;
    return choice?.for === state ? withFormat(state.deck, choice.format, choice.commanders) : state.deck;
  }, [state, choice]);
  // Retour à Commander sans commandant : on reprend celui lu dans la liste.
  const changeShape = (format: DetectedFormat, commanders: string[]) =>
    setChoice({
      for: state,
      format,
      commanders: format === "commander" && commanders.length === 0 && state.status === "ok" ? state.deck.commanders : commanders,
    });

  const estimate = useMemo(
    () => (state.status === "ok" && deck ? buildEstimate(deck, state.prices, manual) : null),
    [state, deck, manual],
  );

  // Niveau de puissance (Commander) : demandé au serveur pour la liste et le(s) commandant(s) retenus.
  const bracketKey = deck?.format === "commander" ? formatDecklist(deck) : null;
  const [bracket, setBracket] = useState<{ key: string; result: BracketState } | null>(null);
  useEffect(() => {
    if (!bracketKey || !deck) return;
    let alive = true;
    bracketAction(bracketKey, deck.commanders).then((result) => {
      if (alive) setBracket({ key: bracketKey, result });
    });
    return () => {
      alive = false;
    };
  }, [bracketKey, deck]);
  const bracketResult = bracket && bracket.key === bracketKey ? bracket.result : null;

  return (
    <>
      {/* Bandeau façon page de deck : illustration floutée sous un dégradé. */}
      <section className="relative overflow-hidden bg-banner text-banner-ink">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src={BANNER_ART}
            alt=""
            fill
            preload
            unoptimized
            sizes="100vw"
            className="scale-110 object-cover object-[50%_30%] opacity-70 blur-[6px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-banner via-banner/80 to-banner/10" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-banner to-transparent" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-14">
          <h1 className="display max-w-3xl text-4xl sm:text-5xl">Estime la valeur de ton deck</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-banner-muted">
            Colle ta decklist : decksell la chiffre carte par carte d&apos;après les prix Cardmarket, en euros, puis
            t&apos;aide à la mettre en vente au juste prix.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-banner-ink/90">
            {["Modern · Commander", "Prix Cardmarket en €", "MTGO · Arena · Moxfield · Archidekt"].map((t) => (
              <li key={t} className="rounded-md bg-white/10 px-2.5 py-1 ring-1 ring-white/10">
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[11px] text-banner-muted/80">Illustration : {BANNER_CREDIT}</p>
        </div>
      </section>

      {/* L'outil : la liste à gauche, le résultat à droite. */}
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 pt-6 sm:px-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:items-start">
        <form
          id="estimer"
          action={formAction}
          className="scroll-mt-20 rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5 lg:sticky lg:top-20"
        >
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <label htmlFor="decklist" className="font-semibold">
              Decklist
            </label>
            <button type="button" onClick={() => setText(SAMPLE_DECK)} className="text-sm font-medium text-link hover:underline">
              Essayer avec un exemple
            </button>
          </div>
          {/* Import par lien : remplit la liste, qu'on peut relire avant d'estimer. */}
          <div className="mb-3">
            <label htmlFor="deck-url" className="sr-only">
              Lien d&apos;un deck Archidekt
            </label>
            <div className="flex gap-2">
              <input
                id="deck-url"
                type="url"
                inputMode="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => {
                  // Entrée importe le lien au lieu d'envoyer le formulaire d'estimation.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    importFromUrl();
                  }
                }}
                placeholder="Lien Archidekt (archidekt.com/decks/…)"
                aria-describedby={importError ? "deck-url-error" : undefined}
                className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-sunken px-3 text-sm outline-none placeholder:text-muted/70 focus:border-link focus:ring-2 focus:ring-link/25"
              />
              <button
                type="button"
                onClick={importFromUrl}
                disabled={importing || !importUrl.trim()}
                className="h-9 shrink-0 rounded-lg border border-line px-3 text-sm font-medium transition hover:border-link/50 hover:text-link disabled:opacity-50"
              >
                {importing ? "Import…" : "Importer"}
              </button>
            </div>
            {importError && (
              <p id="deck-url-error" role="alert" className="mt-1.5 text-xs text-danger">
                {importError}
              </p>
            )}
          </div>
          <textarea
            id="decklist"
            name="decklist"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            spellCheck={false}
            rows={16}
            placeholder={"4 Lightning Bolt\n4 Ragavan, Nimble Pilferer\n…\n\nSideboard\n2 Engineered Explosives"}
            className="block w-full resize-y rounded-lg border border-line bg-sunken px-3 py-2.5 font-mono text-[13px] leading-6 outline-none placeholder:text-muted/70 focus:border-link focus:ring-2 focus:ring-link/25 max-sm:h-48"
          />
          <p className="mt-2 text-xs text-muted">
            Une carte par ligne, avec la réserve à la suite (Modern) ou le commandant en tête (Commander). Ou importe un
            deck Archidekt par son lien.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent font-semibold text-on-accent transition hover:bg-accent-hover disabled:cursor-progress disabled:opacity-70"
          >
            {pending && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {pending ? "Estimation…" : "Estimer le deck"}
          </button>
        </form>

        <section
          id="resultat"
          aria-live="polite"
          className="min-w-0 scroll-mt-20 space-y-6"
        >
          {pending && <EstimateSkeleton />}
          {!pending && state.status === "idle" && <HowItWorks />}
          {!pending && state.status === "error" && (
            <div className="rounded-xl border border-danger/30 bg-danger-soft px-5 py-4 text-danger">{state.message}</div>
          )}
          {!pending && state.status === "ok" && estimate && deck && (
            <div key={revealId(state)} className="space-y-6">
              <Receipt estimate={estimate} pricesAsOf={state.pricesAsOf} deck={deck} />
              {deck.format === "commander" &&
                (bracketResult?.status === "ok" ? (
                  <BracketCard facts={bracketResult.facts} min={bracketResult.min} />
                ) : bracketResult?.status === "error" ? (
                  <p className="rounded-xl border border-line bg-surface px-5 py-4 text-sm text-muted">
                    Niveau de puissance indisponible pour l&apos;instant.
                  </p>
                ) : (
                  <div className="h-40 animate-pulse rounded-xl border border-line bg-surface" aria-label="Calcul du niveau de puissance" />
                ))}
              <SellPanel
                bracketMin={bracketResult?.status === "ok" ? bracketResult.min : null}
                decklist={text}
                estimate={estimate}
                manual={manual}
                archetypes={archetypes}
                deck={deck}
                onShapeChange={changeShape}
              />
              <ParseNotes deck={state.deck} />
              {!estimate.complete || Object.keys(manual).length > 0 ? (
                <MissingPrices
                  lines={estimate.lines.filter((l) => l.unitCents == null || l.status === "manual")}
                  complete={estimate.complete}
                  inputs={manualInputs}
                  onChange={(key, value) => setManualInputs((m) => ({ ...m, [key]: value }))}
                />
              ) : null}
              {deck.format === "commander" ? (
                <>
                  <CardList
                    title={deck.commanders.length > 1 ? "Commandants" : "Commandant"}
                    lines={estimate.lines.filter((l) => l.board === "main" && isCommander(deck, l.name))}
                    totalCents={sumCents(estimate.lines.filter((l) => l.board === "main" && isCommander(deck, l.name)))}
                  />
                  <CardList
                    title="Deck"
                    lines={estimate.lines.filter((l) => l.board === "main" && !isCommander(deck, l.name))}
                    totalCents={sumCents(estimate.lines.filter((l) => l.board === "main" && !isCommander(deck, l.name)))}
                  />
                </>
              ) : (
                <CardList
                  title="Deck principal"
                  lines={estimate.lines.filter((l) => l.board === "main")}
                  totalCents={estimate.mainCents}
                />
              )}
              <CardList
                title="Réserve"
                lines={estimate.lines.filter((l) => l.board === "side")}
                totalCents={estimate.sideCents}
              />
            </div>
          )}
        </section>
      </div>
    </>
  );
}

/** Avant estimation : le mode d'emploi, dans la colonne du résultat. */
function HowItWorks() {
  const steps = [
    ["Colle ta liste", "Exportée depuis MTGO, Arena, Moxfield ou MTGGoldfish, telle quelle."],
    ["Lis le prix", "Chaque carte au prix de son impression la moins chère sur Cardmarket, avec la date des prix."],
    ["Complète", "Une carte sans prix ? Indique le tien : le total se met à jour."],
    ["Mets-le en vente", "Publie ton deck au prix de ton choix et suis la vente depuis ton espace."],
  ];
  return (
    <div className="rounded-xl border border-line bg-surface">
      <h2 className="border-b border-line px-5 py-4 font-semibold">Comment ça marche</h2>
      <ol className="divide-y divide-line">
        {steps.map(([title, text], i) => (
          <li key={title} className="flex gap-4 px-5 py-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-soft text-sm font-semibold tabular-nums text-link">
              {i + 1}
            </span>
            <div>
              <p className="font-medium">{title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const sumCents = (lines: PricedLine[]) => lines.reduce((n, l) => n + (l.lineCents ?? 0), 0);

/** Le résultat : la carte phare révélée en dernier, et la valeur du deck écrite en toutes lettres. */
function Receipt({ estimate, pricesAsOf, deck }: { estimate: Estimate; pricesAsOf: string | null; deck: ParsedDeck }) {
  const commander = deck.format === "commander";
  const priced = estimate.lines.filter((l) => l.lineCents != null);
  const byValue = [...priced].sort((a, b) => b.unitCents! - a.unitCents!);
  const star = byValue[0];
  const top5 = [...priced].sort((a, b) => b.lineCents! - a.lineCents!).slice(0, 5);
  const topShare =
    estimate.totalCents > 0 ? Math.round((top5.reduce((n, l) => n + l.lineCents!, 0) / estimate.totalCents) * 100) : 0;

  return (
    <section className="grid gap-6 rounded-xl border border-line bg-surface p-5 sm:p-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
      {star?.card?.imageUrl && (
        <figure className="flip-in mx-auto w-[160px] [animation-delay:600ms] sm:w-[180px]">
          <TiltCard className="relative aspect-[488/680] overflow-hidden rounded-[4.75%/3.5%] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.55)] ring-[3px] ring-reveal">
            <Image src={star.card.imageUrl} alt={star.card.name} fill sizes="180px" unoptimized className="object-cover" />
          </TiltCard>
          <figcaption className="mt-3 text-center text-sm">
            <span className="font-semibold text-reveal">Carte phare</span>
            <span className="block text-muted">
              {formatEur(star.unitCents!)} l&apos;unité
              {star.card.artist && <> · Ill. {star.card.artist}</>}
            </span>
          </figcaption>
        </figure>
      )}

      <div>
        <p className="mb-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-md bg-banner px-1.5 py-0.5 text-[11px] font-bold uppercase leading-none tracking-wide text-banner-ink">
            {commander ? "Commander" : "Modern"}
          </span>
          {commander && (
            <span className="text-muted">
              {deck.commanders.length > 0
                ? `Commandant : ${deck.commanders.join(" et ")}`
                : "Commandant à indiquer à la mise en vente"}
            </span>
          )}
        </p>
        <p className="text-lg text-muted">Ce deck vaut environ</p>
        <p className="display mt-1 text-[clamp(2.5rem,5vw,3.75rem)] tabular-nums">
          <CountUp cents={estimate.totalCents} />
          {!estimate.complete && <span className="ml-1 text-warn">+</span>}
        </p>
        <p className="mt-4 max-w-[60ch] leading-relaxed">
          {commander
            ? `${formatEur(estimate.mainCents)} pour les ${deck.mainCount} cartes du deck${estimate.sideCents > 0 ? `, et ${formatEur(estimate.sideCents)} hors du deck` : ""}.`
            : `${formatEur(estimate.mainCents)} pour le deck principal et ${formatEur(estimate.sideCents)} pour la réserve.`}
          {top5.length > 0 && (
            <>
              {" "}
              Les {top5.length} cartes les plus chères font <strong>{topShare} %</strong> du total.
            </>
          )}
        </p>
        <p className="mt-4">
          {estimate.complete ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-ok-soft px-3 py-1 text-sm font-medium text-ok">
              Estimation complète
            </span>
          ) : (
            <span className="hatch inline-flex items-center gap-2 rounded-full border border-warn/40 px-3 py-1 text-sm font-medium text-warn">
              Incomplète : {estimate.unpricedCardCount} carte{estimate.unpricedCardCount > 1 ? "s" : ""} sans prix
            </span>
          )}
        </p>
        <p className="mt-5 text-xs leading-relaxed text-muted">
          Prix Cardmarket (impression non-foil la moins chère), via Scryfall
          {pricesAsOf && <> · mis à jour le {new Date(pricesAsOf).toLocaleDateString("fr-FR")}</>}. Indicatif : ce
          n&apos;est pas un prix de revente.
        </p>
      </div>
    </section>
  );
}

function ParseNotes({ deck }: { deck: Extract<EstimateState, { status: "ok" }>["deck"] }) {
  if (deck.errors.length === 0 && deck.warnings.length === 0) return null;
  return (
    <details className="rounded-xl border border-line bg-surface px-5 py-3 text-sm">
      <summary className="cursor-pointer font-medium">
        {deck.errors.length > 0
          ? `${deck.errors.length} ligne${deck.errors.length > 1 ? "s" : ""} ignorée${deck.errors.length > 1 ? "s" : ""}`
          : "Remarques sur la liste"}
        {deck.warnings.length > 0 && deck.errors.length > 0 && " · remarques"}
      </summary>
      <ul className="mt-2 space-y-1 text-muted">
        {deck.warnings.map((w) => (
          <li key={w}>{w}</li>
        ))}
        {deck.errors.map((e) => (
          <li key={e.line}>
            Ligne {e.line} : <code className="rounded bg-sunken px-1">{e.text.trim()}</code>
          </li>
        ))}
      </ul>
    </details>
  );
}

function MissingPrices({
  lines,
  complete,
  inputs,
  onChange,
}: {
  lines: PricedLine[];
  complete: boolean;
  inputs: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  if (lines.length === 0) return null;
  return (
    <section className={`rounded-xl border p-5 ${complete ? "border-line bg-surface" : "hatch border-warn/40"}`}>
      <h2 className="text-lg font-semibold">{complete ? "Prix saisis à la main" : "Cartes à compléter"}</h2>
      <p className="mt-2 text-sm">
        {complete
          ? "Ces prix sont inclus dans le total. Vide un champ pour retirer la carte du total."
          : "Les cartes sans prix ne sont pas comptées dans le total. Indique un prix à l’unité pour les inclure."}
      </p>
      <ul className="mt-4 space-y-2">
        {lines.map((l) => {
          const key = normalizeName(l.name);
          const foil = l.card?.minPriceEurFoil;
          return (
            <li
              key={`${l.board}-${l.name}`}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-surface px-3 py-2.5 ring-1 ring-line"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {l.quantity} × {l.name}
                </p>
                <p className="text-xs text-muted">
                  {l.status === "manual"
                    ? "Prix saisi"
                    : l.status === "not_found"
                      ? "Nom introuvable : vérifie l'orthographe"
                      : foil != null
                        ? `Existe seulement en foil (dès ${formatEur(Math.round(foil * 100))})`
                        : "Aucun prix sur Cardmarket"}
                </p>
              </div>
              <label className="flex items-center gap-1.5 text-sm">
                <span className="sr-only">Prix unitaire de {l.name}</span>
                <input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={inputs[key] ?? ""}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="w-24 rounded-lg border border-line bg-sunken px-2 py-1.5 text-right tabular-nums outline-none focus:border-link focus:ring-2 focus:ring-link/25"
                />
                <span className="text-muted">€</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
