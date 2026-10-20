"use client";

import { submitWithoutReset } from "@/lib/form";
import { useActionState, useTransition } from "react";
import { deleteListing, updateListing, type FormState } from "@/app/espace/actions";
import { formatEur } from "@/lib/pricing";
import { CONDITIONS, STATUSES, type Listing, type ListingStatus } from "@/lib/listings";

const STATUS_STYLE: Record<ListingStatus, string> = {
  active: "bg-ok-soft text-ok",
  reserved: "bg-warn-soft text-warn",
  sold: "bg-accent-soft text-accent",
  withdrawn: "bg-sunken text-muted",
};

const fieldClass =
  "rounded-lg border border-line bg-sunken px-2.5 py-1.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25";

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export function ListingCard({ listing: l }: { listing: Listing }) {
  const [state, action, saving] = useActionState<FormState, FormData>(updateListing.bind(null, l.id), {
    status: "idle",
  });
  const [deleting, startDelete] = useTransition();
  const diff = l.estimated_cents > 0 ? Math.round(((l.asking_cents - l.estimated_cents) / l.estimated_cents) * 100) : null;

  return (
    <li className={`rounded-2xl border border-line bg-surface p-4 sm:p-5 ${deleting ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
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
        <button
          type="submit"
          disabled={saving}
          className="h-[34px] rounded-lg bg-foreground px-3 text-sm font-medium text-background hover:opacity-85 disabled:opacity-50"
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

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted hover:text-foreground">Voir la liste et la description</summary>
        {l.description && <p className="mt-2 whitespace-pre-line">{l.description}</p>}
        <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-sunken p-3 font-mono text-xs leading-5">
          {l.decklist}
        </pre>
      </details>
    </li>
  );
}
