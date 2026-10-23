"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteListing, setListingStatus } from "@/app/espace/actions";
import { useToast } from "./toaster";
import { formatEur } from "@/lib/pricing";
import { CONDITIONS, PUBLIC_STATUSES, STATUSES, artCrop, type Listing, type ListingStatus } from "@/lib/listings";
import { LanguageBar } from "./language-bar";
import { ManaColors } from "./mana";

const STATUS_STYLE: Record<ListingStatus, string> = {
  active: "bg-ok-soft text-ok",
  reserved: "bg-warn-soft text-warn",
  sold: "bg-brand-soft text-link",
  withdrawn: "bg-sunken text-muted",
};

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

/** Une annonce dans « Mes annonces » : l'essentiel, le statut en un clic ; le reste se modifie sur sa page. */
export function ListingCard({ listing: l }: { listing: Listing }) {
  const [deleting, startDelete] = useTransition();
  const [changing, startChange] = useTransition();
  const [status, setStatus] = useState<ListingStatus>(l.status);
  const toast = useToast();

  function changeStatus(next: ListingStatus) {
    const previous = status;
    setStatus(next); // affichage immédiat, annulé si l'enregistrement échoue
    startChange(async () => {
      const r = await setListingStatus(l.id, next);
      if (r.status === "error") {
        setStatus(previous);
        toast("error", r.message);
      } else toast("success", `Annonce « ${l.title} » : ${STATUSES[next].toLowerCase()}`);
    });
  }
  const diff = l.estimated_cents > 0 ? Math.round(((l.asking_cents - l.estimated_cents) / l.estimated_cents) * 100) : null;
  // Ce qui manque pour que l'annonce soit bien trouvée dans les filtres de l'index.
  const missing = [
    (l.colors ?? []).length === 0 && "les couleurs",
    !l.archetype && "l'archétype",
    l.french_percent == null && "la langue des cartes",
  ].filter(Boolean) as string[];

  return (
    <li className={`rounded-xl border border-line bg-surface p-4 sm:p-5 ${deleting ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative hidden h-14 w-20 shrink-0 overflow-hidden rounded-md bg-sunken sm:block">
            {artCrop(l.cover_image_url) && (
              <Image src={artCrop(l.cover_image_url)!} alt="" fill sizes="80px" unoptimized className="object-cover" />
            )}
          </div>
          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{l.title}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
              {STATUSES[status]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {l.card_count} cartes · {CONDITIONS[l.condition]} · publiée le {date(l.created_at)}
            {l.status === "sold" && l.sold_at && ` · vendue le ${date(l.sold_at)}`}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <ManaColors colors={l.colors ?? []} size={16} emptyLabel="Couleurs à renseigner" />
            <span className="rounded-md bg-sunken px-1.5 py-0.5 font-medium text-muted">{l.archetype?.name ?? "Non classé"}</span>
          </p>
          <LanguageBar frenchPercent={l.french_percent} details={l.card_details} className="mt-2 max-w-60" />
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums">
            {formatEur(l.status === "sold" && l.sold_cents ? l.sold_cents : l.asking_cents)}
          </p>
          <p className="text-xs tabular-nums text-muted">
            Estimé {formatEur(l.estimated_cents)}
            {!l.estimate_complete && "+"}
            {diff != null && diff !== 0 && ` · ${diff > 0 ? "+" : ""}${diff} %`}
          </p>
        </div>
      </div>

      {missing.length > 0 && l.status !== "sold" && l.status !== "withdrawn" && (
        <p className="hatch mt-4 rounded-lg border border-warn/40 px-3 py-2 text-sm text-warn">
          <strong className="font-semibold">À compléter :</strong> {missing.join(", ")}.{" "}
          <Link href={`/espace/annonces/${l.id}`} className="font-semibold underline">
            Modifier l&apos;annonce
          </Link>{" "}
          pour qu&apos;elle apparaisse dans les filtres des decks en vente.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <label className="flex items-center gap-2 text-sm text-muted">
          Statut
          <select
            value={status}
            disabled={changing}
            onChange={(e) => changeStatus(e.target.value as ListingStatus)}
            className="h-9 rounded-lg border border-line bg-sunken px-2.5 text-sm text-foreground outline-none focus:border-link focus:ring-2 focus:ring-link/25 disabled:opacity-60"
          >
            {Object.entries(STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Link
          href={`/espace/annonces/${l.id}`}
          className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
        >
          Modifier
        </Link>
        {(PUBLIC_STATUSES as readonly string[]).includes(status) && (
          <Link
            href={`/decks/${l.id}`}
            className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm font-medium transition hover:border-link/50 hover:text-link"
          >
            Voir l&apos;annonce
          </Link>
        )}
        <button
          type="button"
          disabled={deleting}
          onClick={() => {
            if (confirm(`Supprimer l'annonce « ${l.title} » ? Ses conversations avec les acheteurs seront aussi effacées. Cette action est définitive.`)) {
              startDelete(async () => {
                const res = await deleteListing(l.id);
                if (res.status === "error") toast("error", res.message);
                else toast("success", `Annonce « ${l.title} » supprimée`);
              });
            }
          }}
          className="ml-auto h-9 rounded-lg px-3 text-sm text-danger hover:bg-danger-soft"
        >
          Supprimer
        </button>
      </div>
    </li>
  );
}
