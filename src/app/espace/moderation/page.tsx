import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { REPORT_STATUSES, REPORT_STATUS_STYLE as STATUS_STYLE, isAdmin, listReports, type ReportStatus } from "@/lib/moderation";
import { shortDate } from "@/lib/message-dates";

export const metadata: Metadata = { title: "Modération", robots: { index: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const FILTERS: { value: ReportStatus | "all"; label: string }[] = [
  { value: "open", label: "À traiter" },
  { value: "resolved", label: "Résolus" },
  { value: "dismissed", label: "Sans suite" },
  { value: "all", label: "Tous" },
];

export default function ModerationPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-sunken" aria-busy />}>
      <Reports searchParams={searchParams} />
    </Suspense>
  );
}

async function Reports({ searchParams }: { searchParams: SearchParams }) {
  await requireUser("/espace/moderation");
  if (!(await isAdmin())) notFound();

  const raw = (await searchParams).statut;
  const filter = FILTERS.find((f) => f.value === raw)?.value ?? "open";
  const reports = await listReports(filter === "all" ? null : filter);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold">Signalements</h2>
        <p className="text-sm text-muted">
          Conversations signalées par les membres. Ouvre un signalement pour lire l&apos;échange et le traiter.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1.5" aria-label="Filtrer les signalements">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "open" ? "/espace/moderation" : `/espace/moderation?statut=${f.value}`}
            aria-current={filter === f.value ? "page" : undefined}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              filter === f.value ? "border-link bg-brand-soft text-link" : "border-line text-muted hover:text-foreground"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {!reports ? (
        <p className="rounded-xl bg-danger-soft px-5 py-4 text-danger">Impossible de charger les signalements.</p>
      ) : reports.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">
          {filter === "open" ? "Aucun signalement à traiter. Tout est calme." : "Aucun signalement ici."}
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {reports.map((r) => (
            <li key={r.id}>
              <Link href={`/espace/moderation/${r.id}`} className="block px-4 py-3.5 transition hover:bg-sunken sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {r.reporter_name} signale {r.reported_name}
                    <span className="ml-2 text-xs font-normal text-muted">
                      ({r.reported_role === "seller" ? "vendeur" : "acheteur"}) · {r.listing_title}
                    </span>
                  </p>
                  <span className="flex items-center gap-2 text-xs text-muted">
                    <span className={`rounded-md px-2 py-0.5 font-semibold ${STATUS_STYLE[r.status]}`}>{REPORT_STATUSES[r.status]}</span>
                    {shortDate(r.created_at)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">« {r.reason} »</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
