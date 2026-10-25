"use server";

import { refresh } from "next/cache";
import { getUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { MAX_PHOTOS, PRIMER_MAX } from "@/lib/listing-media";
import type { FormState } from "./actions";

// Photos réelles du deck et primer : deux compléments facultatifs d'une annonce.
// Tout passe par le client du membre : RLS (annonces) et règles du stockage (son dossier) garantissent
// qu'il ne touche qu'à ses propres annonces et images.

const NOT_LOGGED: FormState = { status: "error", message: "Ta session a expiré. Reconnecte-toi." };
const PHOTO_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);
const BUCKET = "listing-photos";

type MediaRow = { photos: string[] | null };

/** Photos actuelles de l'annonce du membre (null : introuvable ou schéma pas à jour). */
async function currentPhotos(listingId: string, userId: string) {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("listings").select("photos").eq("id", listingId).eq("seller_id", userId).maybeSingle();
  if (error || !data) return { supabase, photos: null };
  return { supabase, photos: (data as MediaRow).photos ?? [] };
}

/** Chemin de l'image dans le stockage, à partir de son adresse publique (null si elle vient d'ailleurs). */
function storagePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

/** Ajoute une photo (déjà réduite dans le navigateur) à la fin de la galerie. */
export async function uploadListingPhoto(listingId: string, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Aucune image reçue." };
  if (!PHOTO_TYPES.has(file.type)) return { status: "error", message: "Format accepté : JPEG, PNG ou WebP." };
  if (file.size > 2 * 1024 * 1024) return { status: "error", message: "Image trop lourde (2 Mo maximum)." };

  const { supabase, photos } = await currentPhotos(listingId, user.id);
  if (!photos) return { status: "error", message: "Annonce introuvable, ou base pas encore à jour." };
  if (photos.length >= MAX_PHOTOS) return { status: "error", message: `${MAX_PHOTOS} photos au maximum.` };

  const bucket = supabase.storage.from(BUCKET);
  const path = `${user.id}/${listingId}/photo-${Date.now()}.${file.type.split("/")[1]}`;
  const { error: upload } = await bucket.upload(path, file, { contentType: file.type, upsert: false });
  if (upload) {
    console.error("Photo d'annonce : envoi impossible", upload.message);
    return { status: "error", message: "Envoi de la photo impossible. Réessaie." };
  }
  const url = bucket.getPublicUrl(path).data.publicUrl;
  const { error } = await supabase
    .from("listings")
    .update({ photos: [...photos, url], updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("seller_id", user.id);
  if (error) {
    await bucket.remove([path]);
    return { status: "error", message: "Enregistrement de la photo impossible. Réessaie." };
  }
  refresh();
  return { status: "saved" };
}

/** Retire une photo de la galerie et supprime l'image. */
export async function deleteListingPhoto(listingId: string, url: string): Promise<FormState> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;
  const { supabase, photos } = await currentPhotos(listingId, user.id);
  if (!photos) return { status: "error", message: "Annonce introuvable." };
  if (!photos.includes(url)) return { status: "saved" };
  const { error } = await supabase
    .from("listings")
    .update({ photos: photos.filter((p) => p !== url), updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("seller_id", user.id);
  if (error) return { status: "error", message: "Suppression impossible. Réessaie." };
  const path = storagePath(url);
  if (path) await supabase.storage.from(BUCKET).remove([path]);
  refresh();
  return { status: "saved" };
}

/** Passe une photo en premier : c'est elle qu'on voit en ouvrant la galerie. */
export async function makeCoverPhoto(listingId: string, url: string): Promise<FormState> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;
  const { supabase, photos } = await currentPhotos(listingId, user.id);
  if (!photos || !photos.includes(url)) return { status: "error", message: "Photo introuvable." };
  const { error } = await supabase
    .from("listings")
    .update({ photos: [url, ...photos.filter((p) => p !== url)], updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("seller_id", user.id);
  if (error) return { status: "error", message: "Enregistrement impossible. Réessaie." };
  refresh();
  return { status: "saved" };
}

/** Enregistre le primer (vide : retiré de l'annonce). */
export async function updatePrimer(listingId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;
  const raw = String(formData.get("primer") ?? "").replace(/\r\n/g, "\n").trim();
  if (raw.length > PRIMER_MAX) return { status: "error", message: `Le primer fait ${PRIMER_MAX} caractères au maximum.` };
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("listings")
    .update({ primer: raw === "" ? null : raw, updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("seller_id", user.id);
  if (error) return { status: "error", message: "Enregistrement impossible. Réessaie (la base est-elle à jour ?)." };
  refresh();
  return { status: "saved" };
}
