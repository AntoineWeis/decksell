"use server";

import { redirect } from "next/navigation";
import { setFlash } from "@/lib/flash";
import { getUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { formatDecklist, parseDecklist, withFormat } from "@/lib/decklist";
import { buildEstimate, parseEur, starCard, type ManualPrices } from "@/lib/pricing";
import { lookupDeckPrices } from "@/lib/estimate";
import { checkDeckQuality } from "@/lib/quality";
import { CONDITIONS, FORMATS, normalizeColors, normalizeFormat, type Condition } from "@/lib/listings";
import { buildDetails, dominantCondition, frenchPercentOf } from "@/lib/card-details";
import { after } from "next/server";
import { refreshListingMeta } from "@/lib/meta-corpus";
import { refreshUserBadges } from "@/lib/badges-server";
import { fetchBracketFacts } from "@/lib/bracket-server";
import { minBracket, normalizeBracket, toStoredBracket } from "@/lib/bracket";

export type SellState = { status: "idle" } | { status: "error"; message: string } | { status: "auth" };

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/** Prix saisis à la main, envoyés en JSON par la page d'estimation. */
function readManual(raw: string): ManualPrices {
  try {
    const obj = JSON.parse(raw);
    const out: ManualPrices = {};
    if (obj && typeof obj === "object") {
      for (const [k, v] of Object.entries(obj).slice(0, 300)) {
        if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 10_000_000) out[k] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export async function createListing(_prev: SellState, formData: FormData): Promise<SellState> {
  const user = await getUser();
  if (!user) return { status: "auth" };

  const decklist = str(formData.get("decklist"));
  const title = str(formData.get("title"));
  const askingCents = parseEur(str(formData.get("asking_price")));
  const conditionRaw = str(formData.get("condition"));
  const defaultCondition: Condition = conditionRaw in CONDITIONS ? (conditionRaw as Condition) : "near_mint";
  const description = str(formData.get("description"));
  const colors = normalizeColors(formData.getAll("colors"));
  const rawFormat = str(formData.get("format"));
  if (rawFormat !== "" && !(rawFormat in FORMATS)) return { status: "error", message: "Format de jeu inconnu." };
  const format = normalizeFormat(rawFormat);
  const archetypeRaw = str(formData.get("archetype_id"));
  const archetypeId = archetypeRaw === "" ? null : Number(archetypeRaw);

  if (title.length < 3 || title.length > 80) return { status: "error", message: "Le titre doit faire entre 3 et 80 caractères." };
  if (askingCents == null || askingCents <= 0 || askingCents > 10_000_000) {
    return { status: "error", message: "Indique un prix de vente valide." };
  }
  // Commander : un commandant incolore donne un deck sans couleur.
  if (colors.length === 0 && format !== "commander") return { status: "error", message: "Coche au moins une couleur du deck." };
  if (archetypeId != null && !(Number.isInteger(archetypeId) && archetypeId > 0)) {
    return { status: "error", message: "Archétype inconnu." };
  }
  if (description.length > 2000) return { status: "error", message: "Description trop longue (2000 caractères max)." };
  if (decklist === "" || decklist.length > 20_000) return { status: "error", message: "Decklist invalide." };

  // Format et commandant(s) choisis par le vendeur, appliqués à la liste (un commandant rangé
  // en réserve rejoint le deck).
  const chosen = formData.getAll("commanders").filter((v): v is string => typeof v === "string").slice(0, 2);
  const deck = withFormat(parseDecklist(decklist), format, chosen);
  const cardCount = deck.mainCount + deck.sideCount;
  if (cardCount === 0) return { status: "error", message: "Aucune carte reconnue dans la liste." };

  // État et langue par carte : la liste fait foi pour les noms et les quantités.
  let rawDetails: unknown = [];
  try {
    rawDetails = JSON.parse(str(formData.get("card_details")) || "[]");
  } catch {
    rawDetails = [];
  }
  const cardDetails = buildDetails(deck, rawDetails, { condition: defaultCondition, lang: "en" });
  const condition = dominantCondition(cardDetails, defaultCondition);
  const frenchPercent = frenchPercentOf(cardDetails);

  // L'estimation est recalculée ici : on ne se fie pas au total envoyé par le navigateur.
  let estimate;
  try {
    const { prices } = await lookupDeckPrices(deck);
    estimate = buildEstimate(deck, prices, readManual(str(formData.get("manual"))));
  } catch (e) {
    console.error("Mise en vente : estimation impossible", e);
    return { status: "error", message: "Les prix sont momentanément indisponibles. Réessaie dans un instant." };
  }

  // Contrôle qualité selon le format (Modern : 60 cartes, réserve de 15 ; Commander : 100 cartes,
  // commandant, un exemplaire par carte, identité de couleur), cartes légales.
  const quality = checkDeckQuality(estimate, deck);
  if (quality.blocking.length > 0) return { status: "error", message: quality.blocking.join(" ") };

  // Carte phare : la plus chère à l'unité, montrée en vignette dans l'index.
  const star = starCard(estimate);

  // Commander : niveau de puissance recalculé ici ; le vendeur peut annoncer plus que le minimum.
  let bracketCols = {};
  if (format === "commander") {
    const facts = await fetchBracketFacts(deck, estimate);
    const min = minBracket(facts);
    bracketCols = {
      bracket: normalizeBracket(str(formData.get("bracket")), min),
      bracket_min: min,
      bracket_detail: toStoredBracket(facts),
    };
  }

  const supabase = await createSupabaseServer();
  const row = {
    seller_id: user.id,
    title,
    // Commander : liste réécrite avec sa section « Commander », relue à l'identique ensuite.
    decklist: format === "commander" ? formatDecklist(deck) : decklist,
    card_count: cardCount,
    estimated_cents: estimate.totalCents,
    estimate_complete: estimate.complete,
    asking_cents: askingCents,
    condition,
    description: description || null,
    french_percent: frenchPercent,
    card_details: cardDetails,
    colors,
    format,
    ...(format === "commander" ? { commanders: deck.commanders } : {}),
    archetype_id: format === "commander" ? null : archetypeId,
    cover_card_name: star?.name ?? null,
    cover_image_url: star?.imageUrl ?? null,
  };
  const insert = (values: object) => supabase.from("listings").insert(values).select("id").single();
  let { data: created, error } = await insert({ ...row, ...bracketCols });
  // Colonnes du niveau de puissance absentes (schema.sql, section 26) : on publie sans.
  if (error && Object.keys(bracketCols).length > 0 && /bracket/.test(error.message)) {
    ({ data: created, error } = await insert(row));
  }
  if (error) {
    console.error("Mise en vente : écriture impossible", error.message);
    return { status: "error", message: "Impossible d'enregistrer l'annonce. Réessaie dans un instant." };
  }
  // Score de proximité méta (Modern), calculé après la réponse (n'allonge pas la publication).
  if (created && format === "modern") after(() => refreshListingMeta(created.id).catch((e) => console.error("Score méta :", e)));
  // Badges recalculés avant la redirection : l'animation s'affiche dès l'arrivée dans l'espace.
  await refreshUserBadges(user.id);
  await setFlash("success", `Annonce « ${title} » publiée`);
  redirect("/espace");
}

export type ReportState = { status: "idle" } | { status: "sent" } | { status: "error"; message: string };

const REPORT_ERRORS: Record<string, string> = {
  not_logged: "Connecte-toi pour signaler une annonce.",
  invalid_reason: "Explique en quelques mots ce qui ne va pas (5 à 1000 caractères).",
  not_found: "Cette annonce n'est plus en ligne.",
  own_listing: "Tu ne peux pas signaler ta propre annonce.",
  already_reported: "Tu as déjà signalé cette annonce : la modération va l'examiner.",
};

/** Signale une annonce à la modération (fausse annonce, arnaque, contenu interdit…). */
export async function reportListing(listingId: string, _prev: ReportState, formData: FormData): Promise<ReportState> {
  const user = await getUser();
  if (!user) return { status: "error", message: REPORT_ERRORS.not_logged };
  const reason = str(formData.get("reason"));
  if (reason.length < 5 || reason.length > 1000) return { status: "error", message: REPORT_ERRORS.invalid_reason };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("report_listing", { p_listing_id: listingId, p_reason: reason });
  if (error) {
    const code = Object.keys(REPORT_ERRORS).find((k) => error.message.includes(k));
    if (code) return { status: "error", message: REPORT_ERRORS[code] };
    console.error("Signalement d'annonce impossible", error.message);
    return { status: "error", message: "Envoi impossible. Réessaie dans un instant." };
  }
  return { status: "sent" };
}
