"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { alertPriceDrop } from "@/lib/price-alerts";
import { getUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { buildEstimate, parseEur, starCard } from "@/lib/pricing";
import { lookupDeckPrices } from "@/lib/estimate";
import { checkDeckQuality } from "@/lib/quality";
import {
  CONDITIONS,
  FORMATS,
  STATUSES,
  normalizeColors,
  normalizeFormat,
  parsePercent,
  type Condition,
  type ListingStatus,
} from "@/lib/listings";
import { parseDecklist } from "@/lib/decklist";
import { buildDetails, dominantCondition, frenchPercentOf } from "@/lib/card-details";
import { isDepartment } from "@/lib/departments";
import { refreshListingMeta } from "@/lib/meta-corpus";
import { refreshUserBadges } from "@/lib/badges-server";

// Chaque action revérifie le membre : elles sont joignables par n'importe qui (POST).
// Les règles RLS limitent en plus chaque écriture aux données du membre.

export type FormState = { status: "idle" } | { status: "saved" } | { status: "error"; message: string };

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const NOT_LOGGED: FormState = { status: "error", message: "Ta session a expiré. Reconnecte-toi." };

/* ---------- Annonces ---------- */

type SoldInfo = { status: ListingStatus; sold_cents: number | null; sold_at: string | null };

/** Passage à « Vendu » : on note le prix et la date de la vente (gardés s'il l'était déjà). */
function soldFields(current: SoldInfo, status: ListingStatus, askingCents: number) {
  if (status !== "sold") return { sold_cents: null, sold_at: null };
  return {
    sold_cents: current.status === "sold" ? (current.sold_cents ?? askingCents) : askingCents,
    sold_at: current.status === "sold" ? (current.sold_at ?? new Date().toISOString()) : new Date().toISOString(),
  };
}

export async function updateListing(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;

  const status = str(formData.get("status")) as ListingStatus;
  const askingCents = parseEur(str(formData.get("asking_price")));
  if (!(status in STATUSES)) return { status: "error", message: "Statut inconnu." };
  const colors = normalizeColors(formData.getAll("colors"));
  const archetypeRaw = str(formData.get("archetype_id"));
  const archetypeId = archetypeRaw === "" ? null : Number(archetypeRaw);
  if (archetypeId != null && !(Number.isInteger(archetypeId) && archetypeId > 0)) {
    return { status: "error", message: "Archétype inconnu." };
  }
  const rawPercent = str(formData.get("french_percent"));
  const frenchPercent = rawPercent === "" ? null : parsePercent(rawPercent);
  if (rawPercent !== "" && frenchPercent == null) {
    return { status: "error", message: "Part en français : un nombre entre 0 et 100." };
  }
  if (askingCents == null || askingCents <= 0 || askingCents > 10_000_000) {
    return { status: "error", message: "Prix invalide." };
  }
  // Nom et format : envoyés par le formulaire complet de la page de l'annonce.
  const identity: { title?: string; format?: string } = {};
  if (formData.has("title")) {
    const title = str(formData.get("title"));
    if (title.length < 3 || title.length > 80) return { status: "error", message: "Le nom doit faire entre 3 et 80 caractères." };
    if (colors.length === 0) return { status: "error", message: "Coche au moins une couleur du deck." };
    const rawFormat = str(formData.get("format"));
    if (rawFormat !== "" && !(rawFormat in FORMATS)) return { status: "error", message: "Format de jeu inconnu." };
    identity.title = title;
    identity.format = normalizeFormat(rawFormat);
  }

  const supabase = await createSupabaseServer();
  const { data: current } = await supabase
    .from("listings")
    .select("status, sold_cents, sold_at, asking_cents, title")
    .eq("id", id)
    .eq("seller_id", user.id)
    .maybeSingle();
  if (!current) return { status: "error", message: "Annonce introuvable." };
  const sold = soldFields(current as SoldInfo, status, askingCents);

  const { error } = await supabase
    .from("listings")
    .update({
      status,
      asking_cents: askingCents,
      // Champ absent quand la langue vient du détail carte par carte : on n'y touche pas.
      ...(formData.has("french_percent") ? { french_percent: frenchPercent } : {}),
      colors,
      archetype_id: archetypeId,
      ...identity,
      ...sold,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("seller_id", user.id);
  if (error) return { status: "error", message: "Enregistrement impossible. Réessaie." };

  // Prix en baisse sur une annonce en vente : alerte aux membres qui la suivent, après la réponse.
  if (status === "active" && askingCents < current.asking_cents) {
    const drop = { listingId: id, sellerId: user.id, title: identity.title ?? current.title, oldCents: current.asking_cents, newCents: askingCents };
    after(() => alertPriceDrop(drop).catch((e) => console.error("Alerte de prix impossible", e)));
  }

  refresh();
  await refreshUserBadges(user.id);
  return { status: "saved" };
}

/** Changement de statut seul, depuis la liste des annonces ou une conversation. */
export async function setListingStatus(id: string, status: string): Promise<FormState> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;
  if (!(status in STATUSES)) return { status: "error", message: "Statut inconnu." };

  const supabase = await createSupabaseServer();
  const { data: current } = await supabase
    .from("listings")
    .select("status, sold_cents, sold_at, asking_cents")
    .eq("id", id)
    .eq("seller_id", user.id)
    .maybeSingle();
  if (!current) return { status: "error", message: "Annonce introuvable." };

  const next = status as ListingStatus;
  const { error } = await supabase
    .from("listings")
    .update({ status: next, ...soldFields(current as SoldInfo, next, current.asking_cents), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("seller_id", user.id);
  if (error) return { status: "error", message: "Enregistrement impossible. Réessaie." };

  refresh();
  return { status: "saved" };
}

/** État et langue carte par carte d'une annonce déjà publiée. */
export async function updateCardDetails(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;

  const supabase = await createSupabaseServer();
  const { data: current } = await supabase
    .from("listings")
    .select("decklist, condition")
    .eq("id", id)
    .eq("seller_id", user.id)
    .maybeSingle();
  if (!current) return { status: "error", message: "Annonce introuvable." };

  let raw: unknown = [];
  try {
    raw = JSON.parse(str(formData.get("card_details")) || "[]");
  } catch {
    return { status: "error", message: "Saisie illisible. Recharge la page et réessaie." };
  }
  const fallback: Condition = current.condition in CONDITIONS ? (current.condition as Condition) : "near_mint";
  // La liste enregistrée fait foi pour les noms et les quantités.
  const details = buildDetails(parseDecklist(current.decklist), raw, { condition: fallback, lang: "en" });

  const { error } = await supabase
    .from("listings")
    .update({
      card_details: details,
      condition: dominantCondition(details, fallback),
      french_percent: frenchPercentOf(details),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("seller_id", user.id);
  if (error) return { status: "error", message: "Enregistrement impossible. Réessaie." };

  refresh();
  await refreshUserBadges(user.id);
  return { status: "saved" };
}

export type DecklistState = FormState | { status: "saved"; ignored: number };

/**
 * Nouvelle liste de cartes : l'estimation, le nombre de cartes et la carte phare sont
 * recalculés. L'état et la langue des cartes conservées sont gardés ; les nouvelles
 * cartes prennent l'état principal de l'annonce et l'anglais.
 */
export async function updateDecklist(id: string, _prev: DecklistState, formData: FormData): Promise<DecklistState> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;

  const decklist = str(formData.get("decklist"));
  if (decklist === "") return { status: "error", message: "La liste est vide." };
  if (decklist.length > 20_000) return { status: "error", message: "Liste trop longue (20 000 caractères max)." };
  const deck = parseDecklist(decklist);
  const cardCount = deck.mainCount + deck.sideCount;
  if (cardCount === 0) return { status: "error", message: "Aucune carte reconnue dans la liste." };

  const supabase = await createSupabaseServer();
  const { data: current } = await supabase
    .from("listings")
    .select("condition, card_details")
    .eq("id", id)
    .eq("seller_id", user.id)
    .maybeSingle();
  if (!current) return { status: "error", message: "Annonce introuvable." };

  let estimate;
  try {
    const { prices } = await lookupDeckPrices(deck);
    estimate = buildEstimate(deck, prices);
  } catch (e) {
    console.error("Liste : estimation impossible", e);
    return { status: "error", message: "Les prix sont momentanément indisponibles. Réessaie dans un instant." };
  }
  // Mêmes règles qu'à la mise en vente : la liste modifiée doit rester jouable en Modern.
  const quality = checkDeckQuality(estimate);
  if (quality.blocking.length > 0) return { status: "error", message: quality.blocking.join(" ") };

  const fallback: Condition = current.condition in CONDITIONS ? (current.condition as Condition) : "near_mint";
  const details = buildDetails(deck, current.card_details ?? [], { condition: fallback, lang: "en" });
  const star = starCard(estimate);

  const { error } = await supabase
    .from("listings")
    .update({
      decklist,
      card_count: cardCount,
      estimated_cents: estimate.totalCents,
      estimate_complete: estimate.complete,
      card_details: details,
      condition: dominantCondition(details, fallback),
      french_percent: frenchPercentOf(details),
      // Carte phare recalculée ; on garde l'ancienne si aucune carte n'a d'image.
      ...(star?.imageUrl ? { cover_card_name: star.name, cover_image_url: star.imageUrl } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("seller_id", user.id);
  if (error) return { status: "error", message: "Enregistrement impossible. Réessaie." };

  // Nouvelle liste : nouveau score de proximité méta, après la réponse.
  after(() => refreshListingMeta(id).catch((e) => console.error("Score méta :", e)));
  refresh();
  return { status: "saved", ignored: deck.errors.length };
}

export async function deleteListing(id: string): Promise<FormState> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("listings").delete().eq("id", id).eq("seller_id", user.id);
  if (error) return { status: "error", message: "Suppression impossible. Réessaie." };
  refresh();
  return { status: "saved" };
}

/* ---------- Profil ---------- */

function optionalUrl(raw: string, host: RegExp): string | null | false {
  if (raw === "") return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && host.test(u.hostname) ? u.toString() : false;
  } catch {
    return false;
  }
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;

  const displayName = str(formData.get("display_name"));
  if (displayName.length < 2 || displayName.length > 40) {
    return { status: "error", message: "Ton pseudo doit faire entre 2 et 40 caractères." };
  }
  const moxfield = optionalUrl(str(formData.get("moxfield_url")), /^(www\.)?moxfield\.com$/);
  if (moxfield === false) return { status: "error", message: "Le lien Moxfield doit commencer par https://moxfield.com/" };
  const archidekt = optionalUrl(str(formData.get("archidekt_url")), /^(www\.)?archidekt\.com$/);
  if (archidekt === false) {
    return { status: "error", message: "Le lien Archidekt doit commencer par https://archidekt.com/" };
  }

  // Lieu d'expédition et alertes : seulement quand le formulaire les affiche (base à jour).
  const extra: Record<string, unknown> = {};
  if (formData.has("department")) {
    const department = str(formData.get("department"));
    if (department !== "" && !isDepartment(department)) return { status: "error", message: "Département inconnu." };
    const city = str(formData.get("city"));
    if (city.length > 60) return { status: "error", message: "Nom de ville trop long (60 caractères max)." };
    extra.department = department || null;
    extra.city = city || null;
    extra.price_alerts = formData.get("price_alerts") === "on";
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      moxfield_url: moxfield,
      archidekt_url: archidekt,
      email_notifications: formData.get("email_notifications") === "on",
      ...extra,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) return { status: "error", message: "Enregistrement impossible. Réessaie." };

  refresh();
  await refreshUserBadges(user.id);
  return { status: "saved" };
}

const AVATAR_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);

/** Reçoit une image déjà réduite par le navigateur (256 × 256). */
export async function uploadAvatar(formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Aucune image reçue." };
  if (!AVATAR_TYPES.has(file.type)) return { status: "error", message: "Format accepté : JPEG, PNG ou WebP." };
  if (file.size > 1024 * 1024) return { status: "error", message: "Image trop lourde (1 Mo maximum)." };

  const supabase = await createSupabaseServer();
  const bucket = supabase.storage.from("avatars");
  const ext = file.type.split("/")[1];
  const path = `${user.id}/avatar-${Date.now()}.${ext}`; // nom unique : pas d'ancienne image en cache

  const { error } = await bucket.upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error("Photo de profil : envoi impossible", error.message);
    return { status: "error", message: "Envoi de l'image impossible. Réessaie." };
  }

  const { data: existing } = await bucket.list(user.id);
  const old = (existing ?? []).map((f) => `${user.id}/${f.name}`).filter((p) => p !== path);
  if (old.length) await bucket.remove(old);

  const avatarUrl = bucket.getPublicUrl(path).data.publicUrl;
  await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  refresh();
  await refreshUserBadges(user.id);
  return { status: "saved" };
}
