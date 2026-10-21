"use client";

import { submitWithoutReset } from "@/lib/form";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useTransition } from "react";
import { deleteListing, updateListing, type FormState } from "@/app/espace/actions";
import { formatEur } from "@/lib/pricing";
import { CONDITIONS, PUBLIC_STATUSES, STATUSES, artCrop, type Archetype, type Listing, type ListingStatus } from "@/lib/listings";
import { LanguageBar } from "./language-bar";
import { ArchetypeSelect, ColorPicker } from "./deck-tags-fields";
import { ManaColors } from "./mana";

const STATUS_STYLE: Record<ListingStatus, string> = {
  active: "bg-ok-soft text-ok",
  reserved: "bg-warn-soft text-warn",
  sold: "bg-brand-soft text-link",
  withdrawn: "bg-sunken text-muted",
};

const fieldClass =
  "rounded-lg border border-line bg-sunken px-2.5 py-1.5 text-sm outline-none focus:border-link focus:ring-2 focus:ring-link/25";

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export function ListingCard({ listing: l, archetypes }: { listing: Listing; archetypes: Archetype[] }) {
  const [state, action, saving] = useActionState<FormState, FormData>(updateListing.bind(null, l.id), {
    status: "idle",
  });
  const [deleting, startDelete] = useTransition();
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
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[l.status]}`}>
              {STATUSES[l.status]}
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
          <LanguageBar frenchPercent={l.french_percent} className="mt-2 max-w-60" />
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
          <strong className="font-semibold">À compléter :</strong> {missing.join(", ")}. Renseigne-les ci-dessous pour que
          l&apos;annonce apparaisse dans les filtres des decks en vente.
        </p>
      )}
      <form onSubmit={submitWithoutReset(action)} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
        <label className="text-xs text-muted">
          <span className="mb-1 block">Statut</span>
          <select name="status" defaultValue={l.status} className={fieldClass}>
            {Object.entries(STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          <span className="mb-1 block">Prix demandé (€)</span>
          <input
            name="asking_price"
            inputMode="decimal"
            defaultValue={(l.asking_cents / 100).toString().replace(".", ",")}
            className={`${fieldClass} w-28 tabular-nums`}
          />
        </label>
        <ColorPicker defaultColors={l.colors ?? []} compact />
        <label className="text-xs text-muted">
          <span className="mb-1 block">Archétype</span>
          <ArchetypeSelect archetypes={archetypes} defaultId={l.archetype?.id ?? null} className={`${fieldClass} max-w-44`} />
        </label>
        <label className="text-xs text-muted">
          <span className="mb-1 block">Français (%)</span>
          <input
            name="french_percent"
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            defaultValue={l.french_percent ?? ""}
            className={`${fieldClass} w-20 tabular-nums`}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="h-[34px] rounded-lg bg-accent px-3 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "…" : "Enregistrer"}
        </button>
        {state.status === "saved" && !saving && <span className="pb-2 text-xs text-ok">Enregistré</span>}
        {state.status === "error" && <span className="pb-2 text-xs text-danger">{state.message}</span>}

        <button
          type="button"
          disabled={deleting}
          onClick={() => {
            if (confirm(`Supprimer l'annonce « ${l.title} » ? Cette action est définitive.`)) {
              startDelete(() => deleteListing(l.id));
            }
          }}
          className="ml-auto h-[34px] rounded-lg px-3 text-sm text-danger hover:bg-danger-soft"
        >
          Supprimer
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <Link href={`/espace/annonces/${l.id}`} className="font-medium text-link hover:underline">
          Voir le deck en détail
        </Link>
        {(PUBLIC_STATUSES as readonly string[]).includes(l.status) && (
          <Link href={`/decks/${l.id}`} className="font-medium text-link hover:underline">
            Voir l&apos;annonce publique
          </Link>
        )}
      </div>
    </li>
  );
}
