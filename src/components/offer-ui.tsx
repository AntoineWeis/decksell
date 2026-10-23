"use client";

import { useState, useTransition, type FormEvent } from "react";
import { makeOffer, respondOffer, withdrawOffer, type MessageResult } from "@/app/espace/messages/actions";
import { formatEur, parseEur } from "@/lib/pricing";
import type { Offer } from "@/lib/messaging";
import { useToast } from "./toaster";

const STATUS: Record<Offer["status"], { label: string; className: string }> = {
  pending: { label: "En attente de réponse", className: "bg-warn-soft text-warn" },
  accepted: { label: "Acceptée", className: "bg-ok-soft text-ok" },
  declined: { label: "Refusée", className: "bg-danger-soft text-danger" },
  withdrawn: { label: "Retirée", className: "bg-sunken text-muted" },
};

/** Une offre de prix dans le fil, avec les boutons de réponse quand elle est en attente. */
export function OfferCard({
  offer,
  viewer,
  askingCents,
  mine,
}: {
  offer: Offer;
  viewer: "buyer" | "seller";
  askingCents: number;
  mine: boolean;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<MessageResult>, success: string) =>
    start(async () => {
      const r = await fn();
      toast(r.status === "error" ? "error" : "success", r.status === "error" ? r.message : success);
    });
  const diff = askingCents > 0 ? Math.round(((offer.amount_cents - askingCents) / askingCents) * 100) : 0;
  const status = STATUS[offer.status];

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className="w-full max-w-xs rounded-2xl border border-link/30 bg-brand-soft px-4 py-3">
        <p className="text-xs font-medium text-link">{mine ? "Ton offre" : "Offre de l'acheteur"}</p>
        <p className="display mt-0.5 text-2xl tabular-nums">{formatEur(offer.amount_cents)}</p>
        <p className="text-xs tabular-nums text-muted">
          Prix demandé {formatEur(askingCents)}
          {diff !== 0 && ` · ${diff > 0 ? "+" : ""}${diff} %`}
        </p>
        <span className={`mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>

        {offer.status === "pending" && viewer === "seller" && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => respondOffer(offer.id, true), "Offre acceptée")}
              className="h-9 flex-1 rounded-lg bg-accent px-3 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50"
            >
              Accepter
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => respondOffer(offer.id, false), "Offre refusée")}
              className="h-9 flex-1 rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:border-danger/50 hover:text-danger disabled:opacity-50"
            >
              Refuser
            </button>
          </div>
        )}
        {offer.status === "pending" && viewer === "buyer" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => withdrawOffer(offer.id), "Offre retirée")}
            className="mt-3 text-sm text-muted hover:text-danger disabled:opacity-50"
          >
            Retirer mon offre
          </button>
        )}
      </div>
    </div>
  );
}

/** Bouton « Faire une offre » de l'acheteur, sous la zone de réponse. */
export function OfferForm({ conversationId, askingCents }: { conversationId: string; askingCents: number }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const cents = parseEur(amount);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (cents == null || cents <= 0) {
      setError("Indique un montant valide.");
      return;
    }
    const fd = new FormData();
    fd.set("amount", amount);
    start(async () => {
      const r = await makeOffer(conversationId, fd);
      if (r.status === "error") {
        setError(r.message);
        return;
      }
      toast("success", "Offre envoyée");
      setAmount("");
      setError(null);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm font-medium transition hover:border-link/50 hover:text-link"
      >
        Faire une offre de prix
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-xl border border-line bg-sunken/50 p-3">
      <label className="block text-sm font-medium" htmlFor="offer-amount">
        Ton offre <span className="font-normal text-muted">(prix demandé : {formatEur(askingCents)})</span>
      </label>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <span className="relative">
          <input
            id="offer-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            autoFocus
            placeholder={String(Math.round((askingCents * 0.9) / 100))}
            className="h-10 w-36 rounded-lg border border-line bg-surface px-3 pr-8 tabular-nums outline-none focus:border-link focus:ring-2 focus:ring-link/25"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">€</span>
        </span>
        <button
          type="submit"
          disabled={pending || cents == null || cents <= 0}
          className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Envoi…" : "Envoyer l'offre"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-10 px-2 text-sm text-muted hover:text-foreground">
          Annuler
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <p className="mt-2 text-xs text-muted">
        Une nouvelle offre remplace la précédente. Si le vendeur accepte, vous convenez ensuite ensemble de la remise et du
        paiement.
      </p>
    </form>
  );
}
