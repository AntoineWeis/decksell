"use server";

import { redirect } from "next/navigation";
import { setFlash } from "@/lib/flash";
import { getUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { parseDecklist } from "@/lib/decklist";
import { buildEstimate, parseEur, starCard, type ManualPrices } from "@/lib/pricing";
import { lookupDeckPrices } from "@/lib/estimate";
import { checkDeckQuality } from "@/lib/quality";
import { CONDITIONS, normalizeColors, type Condition } from "@/lib/listings";
import { buildDetails, dominantCondition, frenchPercentOf } from "@/lib/card-details";

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
  const archetypeRaw = str(formData.get("archetype_id"));
  const archetypeId = archetypeRaw === "" ? null : Number(archetypeRaw);

  if (title.length < 3 || title.length > 80) return { status: "error", message: "Le titre doit faire entre 3 et 80 caractères." };
  if (askingCents == null || askingCents <= 0 || askingCents > 10_000_000) {
    return { status: "error", message: "Indique un prix de vente valide." };
  }
  if (colors.length === 0) return { status: "error", message: "Coche au moins une couleur du deck." };
  if (archetypeId != null && !(Number.isInteger(archetypeId) && archetypeId > 0)) {
    return { status: "error", message: "Archétype inconnu." };
  }
  if (description.length > 2000) return { status: "error", message: "Description trop longue (2000 caractères max)." };
  if (decklist === "" || decklist.length > 20_000) return { status: "error", message: "Decklist invalide." };

  const deck = parseDecklist(decklist);
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

  // Contrôle qualité : 60 cartes minimum, réserve de 15 au plus, cartes légales en Modern.
  const quality = checkDeckQuality(estimate);
  if (quality.blocking.length > 0) return { status: "error", message: quality.blocking.join(" ") };

  // Carte phare : la plus chère à l'unité, montrée en vignette dans l'index.
  const star = starCard(estimate);

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("listings").insert({
    seller_id: user.id,
    title,
    decklist,
    card_count: cardCount,
    estimated_cents: estimate.totalCents,
    estimate_complete: estimate.complete,
    asking_cents: askingCents,
    condition,
    description: description || null,
    french_percent: frenchPercent,
    card_details: cardDetails,
    colors,
    archetype_id: archetypeId,
    cover_card_name: star?.name ?? null,
    cover_image_url: star?.imageUrl ?? null,
  });
  if (error) {
    console.error("Mise en vente : écriture impossible", error.message);
    return { status: "error", message: "Impossible d'enregistrer l'annonce. Réessaie dans un instant." };
  }
  await setFlash("success", `Annonce « ${title} » publiée`);
  redirect("/espace");
}
