"use client";

import { submitWithoutReset } from "@/lib/form";
import { useActionState, useRef, useState, useTransition } from "react";
import { updateProfile, uploadAvatar, type FormState } from "@/app/espace/actions";
import type { Profile } from "@/lib/auth";
import { Avatar } from "./avatar";

const inputClass =
  "block w-full rounded-xl border border-line bg-sunken px-3 py-2.5 outline-none focus:border-link focus:ring-2 focus:ring-link/25";

/** Recadre l'image au centre et la réduit à 256 × 256 en WebP, avant envoi. */
async function toSquareWebp(file: File, size = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/webp", 0.85),
  );
}

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [state, action, saving] = useActionState<FormState, FormData>(updateProfile, { status: "idle" });
  const [avatarMsg, setAvatarMsg] = useState<FormState>({ status: "idle" });
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function onPickFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarMsg({ status: "error", message: "Choisis une image." });
      return;
    }
    startUpload(async () => {
      try {
        const blob = await toSquareWebp(file);
        const fd = new FormData();
        fd.set("avatar", new File([blob], "avatar.webp", { type: "image/webp" }));
        setAvatarMsg(await uploadAvatar(fd));
      } catch {
        setAvatarMsg({ status: "error", message: "Image illisible. Essaie un autre fichier." });
      } finally {
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <section className="rounded-2xl border border-line bg-surface p-5 text-center">
        <div className={`mx-auto w-fit ${uploading ? "animate-pulse" : ""}`}>
          <Avatar name={profile.displayName} url={profile.avatarUrl} size={112} />
        </div>
        <p className="mt-3 font-semibold">{profile.displayName}</p>
        <p className="text-sm text-muted">{email}</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          id="avatar-input"
          onChange={(e) => onPickFile(e.target.files?.[0])}
        />
        <label
          htmlFor="avatar-input"
          className="mt-4 inline-flex h-9 cursor-pointer items-center rounded-lg border border-line px-3 text-sm font-medium hover:bg-sunken"
        >
          {uploading ? "Envoi…" : profile.avatarUrl ? "Changer la photo" : "Ajouter une photo"}
        </label>
        {avatarMsg.status === "error" && <p className="mt-2 text-xs text-danger">{avatarMsg.message}</p>}
        {avatarMsg.status === "saved" && !uploading && <p className="mt-2 text-xs text-ok">Photo mise à jour</p>}
        <p className="mt-2 text-xs text-muted">JPEG, PNG ou WebP. Recadrée en carré.</p>
      </section>

      <form onSubmit={submitWithoutReset(action)} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Pseudo</span>
          <input name="display_name" defaultValue={profile.displayName} required minLength={2} maxLength={40} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Profil Moxfield</span>
          <input
            name="moxfield_url"
            type="url"
            defaultValue={profile.moxfieldUrl ?? ""}
            placeholder="https://moxfield.com/users/ton-pseudo"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Profil Archidekt</span>
          <input
            name="archidekt_url"
            type="url"
            defaultValue={profile.archidektUrl ?? ""}
            placeholder="https://archidekt.com/u/ton-pseudo"
            className={inputClass}
          />
        </label>
        <p className="text-xs text-muted">Ces liens seront visibles par les acheteurs sur tes annonces.</p>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="h-10 rounded-xl bg-accent px-4 font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {state.status === "saved" && !saving && <span className="text-sm text-ok">Profil enregistré</span>}
          {state.status === "error" && <span className="text-sm text-danger">{state.message}</span>}
        </div>
      </form>
    </div>
  );
}
