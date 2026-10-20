"use server";

import { refresh } from "next/cache";
import { getUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { parseEur } from "@/lib/pricing";
import { STATUSES, type ListingStatus } from "@/lib/listings";

// Chaque action revérifie le membre : elles sont joignables par n'importe qui (POST).
// Les règles RLS limitent en plus chaque écriture aux données du membre.

export type FormState = { status: "idle" } | { status: "saved" } | { status: "error"; message: string };

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const NOT_LOGGED: FormState = { status: "error", message: "Ta session a expiré. Reconnecte-toi." };

/* ---------- Annonces ---------- */

export async function updateListing(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;

  const status = str(formData.get("status")) as ListingStatus;
  const askingCents = parseEur(str(formData.get("asking_price")));
  if (!(status in STATUSES)) return { status: "error", message: "Statut inconnu." };
  if (askingCents == null || askingCents <= 0 || askingCents > 10_000_000) {
    return { status: "error", message: "Prix invalide." };
  }

  const supabase = await createSupabaseServer();
  const { data: current } = await supabase
    .from("listings")
    .select("status, sold_cents, sold_at")
    .eq("id", id)
    .eq("seller_id", user.id)
    .maybeSingle();
  if (!current) return { status: "error", message: "Annonce introuvable." };

  // Passage à « Vendu » : on note le prix et la date de la vente.
  const sold =
    status === "sold"
      ? {
          sold_cents: current.status === "sold" ? (current.sold_cents ?? askingCents) : askingCents,
          sold_at: current.status === "sold" ? (current.sold_at ?? new Date().toISOString()) : new Date().toISOString(),
        }
      : { sold_cents: null, sold_at: null };

  const { error } = await supabase
    .from("listings")
    .update({ status, asking_cents: askingCents, ...sold, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("seller_id", user.id);
  if (error) return { status: "error", message: "Enregistrement impossible. Réessaie." };

  refresh();
  return { status: "saved" };
}

export async function deleteListing(id: string): Promise<void> {
  const user = await getUser();
  if (!user) return;
  const supabase = await createSupabaseServer();
  await supabase.from("listings").delete().eq("id", id).eq("seller_id", user.id);
  refresh();
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

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      moxfield_url: moxfield,
      archidekt_url: archidekt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) return { status: "error", message: "Enregistrement impossible. Réessaie." };

  refresh();
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
  return { status: "saved" };
}
