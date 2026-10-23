"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { reportListing, type ReportState } from "@/app/listing-actions";

/**
 * Lien discret « Signaler l'annonce » sous la fiche, qui déplie un court formulaire.
 * Visiteur non connecté : renvoie vers la connexion.
 */
export function ReportListing({ listingId, loggedIn }: { listingId: string; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, sending] = useActionState<ReportState, FormData>(reportListing.bind(null, listingId), { status: "idle" });
  const linkClass = "text-xs text-muted underline-offset-2 hover:text-danger hover:underline";

  if (!loggedIn) {
    return (
      <Link href={`/connexion?next=${encodeURIComponent(`/decks/${listingId}`)}`} className={linkClass}>
        Signaler l&apos;annonce
      </Link>
    );
  }
  if (state.status === "sent") {
    return <p className="text-xs text-ok">Merci, l&apos;annonce a été signalée à la modération.</p>;
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={linkClass}>
        Signaler l&apos;annonce
      </button>
    );
  }
  return (
    <form action={action} className="space-y-2 rounded-xl border border-line bg-surface p-4">
      <label htmlFor="report-reason" className="block text-sm font-medium">
        Qu&apos;est-ce qui ne va pas ?
      </label>
      <textarea
        id="report-reason"
        name="reason"
        required
        minLength={5}
        maxLength={1000}
        rows={3}
        placeholder="Fausse annonce, prix trompeur, contenu interdit…"
        className="block w-full rounded-lg border border-line bg-sunken px-3 py-2 text-sm outline-none focus:border-link focus:ring-2 focus:ring-link/25"
      />
      {state.status === "error" && (
        <p role="alert" className="text-xs text-danger">
          {state.message}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={sending}
          className="h-8 rounded-lg border border-danger/50 px-3 text-xs font-semibold text-danger transition hover:bg-danger-soft disabled:opacity-50"
        >
          {sending ? "Envoi…" : "Signaler"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-8 rounded-lg px-3 text-xs text-muted hover:text-foreground">
          Annuler
        </button>
      </div>
    </form>
  );
}
