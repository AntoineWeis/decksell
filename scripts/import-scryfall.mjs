// Import des cartes Scryfall (bulk "default_cards") dans la table public.cards.
// Usage : npm run import:scryfall            (import complet)
//         npm run import:scryfall -- --limit 2000   (test sur 2000 cartes)
// Nécessite dans .env.local : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY.
// N'affiche jamais les clés.
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { once } from "node:events";
import { createGunzip } from "node:zlib";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error("ECHEC : NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SECRET_KEY manquante dans .env.local");
  process.exit(1);
}

const limitArg = process.argv.indexOf("--limit");
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
if (!(limit > 0)) {
  console.error("ECHEC : --limit doit être un nombre positif");
  process.exit(1);
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false } });
const HEADERS = { "User-Agent": "decksell/0.1 (import quotidien)", Accept: "application/json;q=0.9,*/*;q=0.8" };
const SKIP_LAYOUTS = new Set([
  "token", "double_faced_token", "emblem", "art_series", "vanguard", "scheme", "planar", "augment", "host",
]);
const BATCH = 500;

function toRow(c, now) {
  const image = c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? null;
  const num = (v) => (v == null || v === "" ? null : Number(v));
  return {
    id: c.id,
    oracle_id: c.oracle_id ?? c.card_faces?.[0]?.oracle_id,
    name: c.name,
    set_code: c.set,
    set_name: c.set_name ?? null,
    collector_number: c.collector_number,
    lang: c.lang ?? "en",
    released_at: c.released_at ?? null,
    rarity: c.rarity ?? null,
    finishes: c.finishes ?? [],
    image_url: image,
    artist: c.artist ?? c.card_faces?.[0]?.artist ?? null,
    cardmarket_id: c.cardmarket_id ?? null,
    scryfall_uri: c.scryfall_uri ?? null,
    legal_modern: c.legalities?.modern === "legal",
    price_eur: num(c.prices?.eur),
    price_eur_foil: num(c.prices?.eur_foil),
    updated_at: now,
  };
}

async function flush(batch) {
  const { error } = await supabase.from("cards").upsert(batch, { onConflict: "id" });
  if (error) {
    console.error("ECHEC à l'écriture :", error.message);
    process.exit(1);
  }
}

// Le fichier Scryfall est du JSON Lines compressé en gzip : on le décompresse
// si l'en-tête gzip est présent, sinon on le lit tel quel.
async function inflateIfGzip(body) {
  const stream = Readable.fromWeb(body);
  await once(stream, "readable");
  const head = stream.read();
  if (!head) return stream;
  stream.unshift(head);
  if (head[0] === 0x1f && head[1] === 0x8b) {
    const gunzip = createGunzip();
    stream.on("error", (e) => gunzip.destroy(e));
    return stream.pipe(gunzip);
  }
  return stream;
}

const meta = await (await fetch("https://api.scryfall.com/bulk-data", { headers: HEADERS })).json();
const bulk = meta.data?.find((d) => d.type === "default_cards");
if (!bulk) {
  console.error("ECHEC : fichier default_cards introuvable chez Scryfall");
  process.exit(1);
}
let downloadUri = bulk.jsonl_download_uri ?? bulk.download_uri;
if (!downloadUri && bulk.uri) {
  // Repli : demander le détail de l'objet, qui doit contenir l'adresse du fichier.
  const detail = await (await fetch(bulk.uri, { headers: HEADERS })).json();
  downloadUri = detail.jsonl_download_uri ?? detail.download_uri;
}
if (!downloadUri) {
  console.error("ECHEC : adresse de téléchargement introuvable. Champs reçus :", Object.keys(bulk).join(", "));
  process.exit(1);
}
const sizeBytes = bulk.compressed_size ?? bulk.size;
console.log(
  "Fichier Scryfall généré le", bulk.updated_at,
  Number.isFinite(sizeBytes) ? "(~" + Math.round(sizeBytes / 1e6) + " Mo compressé)" : ""
);

const res = await fetch(downloadUri, { headers: HEADERS });
if (!res.ok || !res.body) {
  console.error("ECHEC du téléchargement (HTTP " + res.status + ")");
  process.exit(1);
}

// Une carte par ligne (JSON Lines) : on lit ligne à ligne. Les crochets et virgules
// de l'ancien format tableau sont aussi tolérés.
const rl = createInterface({ input: await inflateIfGzip(res.body), crlfDelay: Infinity });
const now = new Date().toISOString();
let batch = [], kept = 0, seen = 0;

for await (const raw of rl) {
  const line = raw.trim().replace(/,$/, "");
  if (line === "[" || line === "]" || line === "") continue;
  seen++;
  let c;
  try { c = JSON.parse(line); } catch { continue; }
  if (!c.games?.includes("paper") || SKIP_LAYOUTS.has(c.layout)) continue;
  const row = toRow(c, now);
  if (!row.oracle_id) continue;
  batch.push(row);
  kept++;
  if (batch.length >= BATCH) {
    await flush(batch);
    batch = [];
    if (kept % 5000 === 0) console.log("  ", kept, "cartes importées...");
  }
  if (kept >= limit) break;
}
if (batch.length) await flush(batch);

const { error } = await supabase.from("price_imports").insert({
  bulk_updated_at: bulk.updated_at,
  card_count: kept,
});
if (error) console.error("Avertissement : journal d'import non écrit :", error.message);

if (kept === 0) {
  console.error("ECHEC : aucune carte lue (", seen, "lignes). Le format du fichier a peut-être changé.");
  process.exit(1);
}
console.log("OK :", kept, "cartes importées sur", seen, "lues.");
