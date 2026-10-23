"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitWithoutReset } from "@/lib/form";
import { DELETE_WORD } from "@/lib/account";
import { deleteAccount, type DeleteState } from "@/app/espace/account-actions";
import { useActionToast } from "./toaster";

/** Zone de suppression définitive du compte, repliée par défaut. */
export function DeleteAccount({ listingCount }: { listingCount: number }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, { status: "idle" });
  useActionToast(state, {});
  const ready = typed.trim().toUpperCase() === DELETE_WORD;

  return (
    <section aria-labelledby="delete-account" className="mt-6 rounded-2xl border border-danger/30 bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h2 id="delete-account" className="font-semibold">
            Supprimer mon compte
          </h2>
          <p className="mt-1 text-sm text-muted">
            Ton profil, ta photo et toutes tes annonces sont effacés définitivement. Ce n&apos;est pas réversible.{" "}
            <Link href="/confidentialite#droits" className="text-link hover:underline">
              Tes droits sur tes données
            </Link>
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-10 shrink-0 rounded-xl border border-danger/40 px-4 text-sm font-semibold text-danger transition hover:bg-danger-soft"
          >
            Supprimer mon compte
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submitWithoutReset(action)} className="mt-5 space-y-4 border-t border-line pt-5">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>
              {listingCount === 0
                ? "Tu n'as aucune annonce."
                : listingCount === 1
                  ? "Ton annonce sera supprimée, même si elle est vendue ou réservée."
                  : `Tes ${listingCount} annonces seront supprimées, y compris celles vendues ou réservées.`}
            </li>
            <li>Ton pseudo, ta photo et tes liens Moxfield et Archidekt disparaîtront du site.</li>
            <li>Tes conversations seront effacées, pour toi comme pour les membres avec qui tu as échangé.</li>
            <li>Tu pourras recréer un compte plus tard avec la même adresse email.</li>
          </ul>
          <label className="block max-w-sm">
            <span className="mb-1.5 block text-sm font-medium">
              Pour confirmer, écris <strong className="font-mono">{DELETE_WORD}</strong>
            </span>
            <input
              name="confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="block w-full rounded-xl border border-line bg-sunken px-3 py-2.5 outline-none focus:border-danger focus:ring-2 focus:ring-danger/25"
            />
          </label>
          {state.status === "error" && (
            <p role="alert" className="text-sm text-danger">
              {state.message}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!ready || pending}
              className="h-10 rounded-xl bg-danger px-4 font-semibold text-background transition hover:brightness-110 disabled:opacity-40"
            >
              {pending ? "Suppression…" : "Supprimer définitivement"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
              className="h-10 rounded-xl px-4 text-sm font-medium text-muted hover:text-foreground"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
