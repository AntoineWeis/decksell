"use client";

import { useTransition } from "react";
import { setListingStatus } from "@/app/espace/actions";
import type { ListingStatus } from "@/lib/listings";
import { useToast } from "./toaster";

const button =
  "inline-flex h-8 items-center rounded-lg border px-3 text-xs font-semibold transition disabled:opacity-50";

/**
 * Statut de l'annonce, pour le vendeur, depuis la conversation : réserver pour cet acheteur,
 * remettre en vente ou marquer vendu, sans repasser par « Mes annonces ».
 */
export function ConversationStatus({
  listingId,
  status,
  buyerName,
}: {
  listingId: string;
  status: ListingStatus;
  buyerName: string;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const set = (next: ListingStatus, success: string) =>
    start(async () => {
      const r = await setListingStatus(listingId, next);
      toast(r.status === "error" ? "error" : "success", r.status === "error" ? r.message : success);
    });

  if (status === "active") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => set("reserved", `Annonce réservée pour ${buyerName}`)}
        className={`${button} border-warn/40 text-warn hover:bg-warn-soft`}
      >
        Réserver pour {buyerName}
      </button>
    );
  }
  if (status === "reserved") {
    return (
      <span className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => set("sold", "Annonce marquée vendue")}
          className={`${button} border-ok/40 text-ok hover:bg-ok-soft`}
        >
          Marquer vendu
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => set("active", "Annonce remise en vente")}
          className={`${button} border-line text-muted hover:text-foreground`}
        >
          Remettre en vente
        </button>
      </span>
    );
  }
  return null;
}
