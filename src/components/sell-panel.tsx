"use client";

import { submitWithoutReset } from "@/lib/form";
import Link from "next/link";
import { useActionState, useState } from "react";
import { createListing, type SellState } from "@/app/listing-actions";
import { formatEur, type Estimate, type ManualPrices } from "@/lib/pricing";
import { CONDITIONS } from "@/lib/listings";

const inputClass =
  "w-full rounded-lg border border-line bg-sunken px-3 py-2 outline-none focus:border-link focus:ring-2 focus:ring-link/25";

/** Mise en vente du deck qui vient d'être estimé. */
export function SellPanel({
  decklist,
  estimate,
  manual,
}: {
  decklist: string;
  estimate: Estimate;
  manual: ManualPrices;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<SellState, FormData>(createListing, { status: "idle" });
  const suggested = (Math.round(estimate.totalCents / 100) || 1).toString();

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-4">
        <div>
          <p className="text-lg font-semibold">Tu veux vendre ce deck ?</p>
          <p className="text-sm text-muted">Crée une annonce en un clic et suis-la depuis ton espace.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-10 rounded-lg bg-accent px-4 font-semibold text-on-accent transition hover:bg-accent-hover"
        >
          Mettre en vente
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submitWithoutReset(action)} className="rounded-xl border border-link/40 bg-surface p-5">
      <h2 className="text-lg font-semibold">Mettre ce deck en vente</h2>
      <p className="mt-1 text-sm text-muted">
        Valeur estimée : {formatEur(estimate.totalCents)}
        {!estimate.complete && " (incomplète)"}. Tu restes libre de ton prix.
      </p>

      <input type="hidden" name="decklist" value={decklist} />
      <input type="hidden" name="manual" value={JSON.stringify(manual)} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Titre de l&apos;annonce</span>
          <input name="title" required minLength={3} maxLength={80} placeholder="Eldrazi Ramp complet, sleevé" className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium">Prix demandé</span>
          <span className="relative block">
            <input
              name="asking_price"
              required
              inputMode="decimal"
              defaultValue={suggested}
              className={`${inputClass} pr-8 tabular-nums`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">€</span>
          </span>
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium">État des cartes</span>
          <select name="condition" defaultValue="near_mint" className={inputClass}>
            {Object.entries(CONDITIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">
            Description <span className="font-normal text-muted">(facultatif)</span>
          </span>
          <textarea
            name="description"
            rows={3}
            maxLength={2000}
            placeholder="Langue des cartes, sleeves, remise en main propre ou envoi…"
            className={`${inputClass} resize-y`}
          />
        </label>
      </div>

      {state.status === "error" && <p className="mt-3 text-sm text-danger">{state.message}</p>}
      {state.status === "auth" && (
        <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
          Connecte-toi pour publier l&apos;annonce : ta liste est gardée.{" "}
          <Link href="/connexion?next=/estimer" className="font-semibold underline">
            Se connecter
          </Link>{" "}
          ou{" "}
          <Link href="/inscription?next=/estimer" className="font-semibold underline">
            créer un compte
          </Link>
          .
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-xl bg-accent px-4 font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Publication…" : "Publier l'annonce"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl px-4 text-muted hover:bg-sunken">
          Annuler
        </button>
      </div>
    </form>
  );
}
