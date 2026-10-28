"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { submitWithoutReset } from "@/lib/form";
import { MAX_PHOTOS, PHOTO_MAX_SIDE, PRIMER_MAX } from "@/lib/listing-media";
import { deleteListingPhoto, makeCoverPhoto, updatePrimer, uploadListingPhoto } from "@/app/espace/listing-media-actions";
import type { FormState } from "@/app/espace/actions";
import { useActionToast, useToast } from "./toaster";

/**
 * Réduit une photo dans le navigateur (1 600 px au plus, WebP) : une photo de téléphone de 5 Mo
 * devient quelques centaines de Ko, sous la limite d'envoi du serveur (1 Mo).
 */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.82, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
    if (blob && blob.size < 950 * 1024) return blob;
  }
  throw new Error("Image trop lourde, même réduite.");
}

/** Galerie de photos réelles du deck : ajout (plusieurs à la fois), photo principale, suppression. */
export function ListingPhotosForm({ listingId, photos }: { listingId: string; photos: string[] }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [pending, startTransition] = useTransition();
  const room = MAX_PHOTOS - photos.length;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files].slice(0, room);
    if (files.length > room) toast("error", `${MAX_PHOTOS} photos au maximum : ${files.length - room} ignorée(s).`);
    setUploading(list.length);
    for (const file of list) {
      try {
        const data = new FormData();
        data.set("photo", new File([await shrink(file)], "photo.webp", { type: "image/webp" }));
        const result = await uploadListingPhoto(listingId, data);
        if (result.status === "error") toast("error", result.message);
      } catch (e) {
        toast("error", e instanceof Error ? e.message : "Envoi impossible.");
      }
      setUploading((n) => n - 1);
    }
    if (input.current) input.current.value = "";
  }

  const act = (fn: () => Promise<FormState>, success: string) =>
    startTransition(async () => {
      const r = await fn();
      toast(r.status === "error" ? "error" : "success", r.status === "error" ? r.message : success);
    });

  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">Photos du deck</h3>
        <span className="text-xs text-muted tabular-nums">
          {photos.length} / {MAX_PHOTOS}
        </span>
      </div>
      <p className="text-sm text-muted">
        Facultatif, mais c&apos;est ce qui rassure le plus un acheteur : le deck étalé, les cartes chères de près, les
        protections. La première photo s&apos;affiche en premier.
      </p>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.map((url, i) => (
          <li key={url} className="group relative aspect-square overflow-hidden rounded-lg bg-sunken ring-1 ring-line">
            {/* eslint-disable-next-line @next/next/no-img-element -- image du stockage, déjà réduite */}
            <img src={url} alt={`Photo ${i + 1}`} className="size-full object-cover" loading="lazy" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-banner/85 px-1.5 py-0.5 text-[11px] font-semibold text-banner-ink">
                Principale
              </span>
            )}
            <div className="absolute inset-x-1 bottom-1 flex justify-end gap-1 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
              {i > 0 && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => act(() => makeCoverPhoto(listingId, url), "Photo principale changée")}
                  title="Mettre en premier"
                  aria-label={`Mettre la photo ${i + 1} en premier`}
                  className="rounded-md bg-surface/90 p-1 text-foreground shadow ring-1 ring-line hover:text-link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
                    <path d="m12 3 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.8Z" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => act(() => deleteListingPhoto(listingId, url), "Photo supprimée")}
                title="Supprimer"
                aria-label={`Supprimer la photo ${i + 1}`}
                className="rounded-md bg-surface/90 p-1 text-foreground shadow ring-1 ring-line hover:text-danger"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                </svg>
              </button>
            </div>
          </li>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <li key={`up-${i}`} className="skel aspect-square rounded-lg" aria-label="Envoi en cours" />
        ))}
        {room - uploading > 0 && (
          <li>
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-xs font-medium text-muted transition hover:border-link hover:text-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-6" aria-hidden>
                <path d="M4 8h3l2-3h6l2 3h3v11H4Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              Ajouter
              <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={uploading > 0}
                onChange={(e) => onFiles(e.target.files)}
                className="sr-only"
              />
            </label>
          </li>
        )}
      </ul>
    </section>
  );
}

/** Primer : comment jouer le deck, expliqué par le vendeur (facultatif). */
export function PrimerForm({ listingId, primer }: { listingId: string; primer: string | null }) {
  const [state, action, saving] = useActionState<FormState, FormData>(updatePrimer.bind(null, listingId), { status: "idle" });
  const [length, setLength] = useState(primer?.length ?? 0);
  useActionToast(state, { success: "Primer enregistré" });
  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-3 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">Primer</h3>
        <span className="text-xs text-muted">Facultatif</span>
      </div>
      <p className="text-sm text-muted">
        Explique comment jouer le deck : plan de jeu, mulligans, cartes clés, conseils de réserve contre les archétypes du
        méta. Il s&apos;affiche sur l&apos;annonce derrière le bouton « Primer ».
      </p>
      <textarea
        name="primer"
        defaultValue={primer ?? ""}
        rows={8}
        maxLength={PRIMER_MAX}
        onChange={(e) => setLength(e.target.value.length)}
        placeholder={"Plan de jeu : …\n\nMulligan : …\n\nRéserve contre Boros Energy : +2 … / −2 …"}
        className="block w-full resize-y rounded-lg border border-line bg-sunken px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-muted/70 focus:border-link focus:ring-2 focus:ring-link/25"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-9 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <span className="text-xs text-muted tabular-nums">
          {length} / {PRIMER_MAX}
        </span>
        {state.status === "error" && <span className="text-sm text-danger">{state.message}</span>}
      </div>
    </form>
  );
}
