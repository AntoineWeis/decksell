// Estime une decklist depuis un fichier texte, avec les prix en base.
// Usage : npm run estimate -- chemin/vers/deck.txt
// Nécessite dans .env.local : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY.
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { parseDecklist } from "../src/lib/decklist.ts";
import { buildEstimate, lookupNames, formatEur } from "../src/lib/pricing.ts";
import { fetchCardPrices, fetchPricesDate } from "../src/lib/price-lookup.ts";

const file = process.argv[2];
if (!file) {
  console.error("Usage : npm run estimate -- chemin/vers/deck.txt");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error("ECHEC : NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SECRET_KEY manquante dans .env.local");
  process.exit(1);
}

const client = createClient(url, secretKey, { auth: { persistSession: false } });
const deck = parseDecklist(await readFile(file, "utf8"));
for (const e of deck.errors) console.warn(`Ligne ${e.line} ignorée : ${e.text.trim()}`);
for (const w of deck.warnings) console.warn("Attention :", w);

const [prices, asOf] = await Promise.all([
  fetchCardPrices(client, lookupNames(deck)),
  fetchPricesDate(client),
]);
const est = buildEstimate(deck, prices);

const LABELS = { priced: "", manual: "(prix saisi)", no_price: "SANS PRIX", not_found: "INTROUVABLE" };
for (const board of ["main", "side"]) {
  console.log(board === "main" ? "\nPrincipal" : "\nRéserve");
  for (const l of est.lines.filter((x) => x.board === board)) {
    const price = l.lineCents == null ? LABELS[l.status] : formatEur(l.lineCents);
    const set = l.card ? ` [${l.card.setCode.toUpperCase()} ${l.card.collectorNumber}]` : "";
    console.log(`  ${String(l.quantity).padStart(2)} ${l.name}${set}`.padEnd(60), price);
  }
}

console.log("\nPrincipal :", formatEur(est.mainCents), "· Réserve :", formatEur(est.sideCents));
console.log("TOTAL :", formatEur(est.totalCents), est.complete ? "" : "(estimation INCOMPLÈTE)");
if (!est.complete) {
  console.log(`${est.unpricedCardCount} carte(s) sans prix, non comptées :`);
  for (const l of est.unpriced) {
    const foil = l.card?.minPriceEurFoil != null ? ` (foil seulement : ${formatEur(Math.round(l.card.minPriceEurFoil * 100))})` : "";
    console.log(`  - ${l.quantity} ${l.name} : ${l.status === "not_found" ? "nom introuvable" : "aucun prix Cardmarket"}${foil}`);
  }
}
if (asOf) console.log("Prix Cardmarket via Scryfall du", new Date(asOf).toLocaleDateString("fr-FR"));
