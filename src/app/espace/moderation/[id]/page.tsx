import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { REPORT_STATUSES, REPORT_STATUS_STYLE, getReport, isAdmin } from "@/lib/moderation";
import { PUBLIC_STATUSES, STATUSES } from "@/lib/listings";
import { dateTimeOf, dayLabel, sameDay, timeOf } from "@/lib/message-dates";
import { ReportDecision } from "@/components/report-decision";

export const metadata: Metadata = { title: "Signalement", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default function ReportPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-sunken" aria-busy />}>
      <ReportDetail params={params} />
    </Suspense>
  );
}

async function ReportDetail({ params }: Props) {
  const { id } = await params;
  await requireUser(`/espace/moderation/${id}`);
  if (!(await isAdmin())) notFound();
  const reportId = Number(id);
  if (!Number.isSafeInteger(reportId) || reportId <= 0) notFound();
  const data = await getReport(reportId);
  if (!data) notFound();
  const { report: r, messages } = data;
  const listingPublic = (PUBLIC_STATUSES as readonly string[]).includes(r.listing_status);

  return (
    <div className="space-y-4">
      <Link href="/espace/moderation" className="inline-block text-sm text-muted hover:text-foreground">
        ← Tous les signalements
      </Link>

      <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">
            {r.reporter_name} signale {r.reported_name}{" "}
            <span className="font-normal text-muted">({r.reported_role === "seller" ? "vendeur" : "acheteur"})</span>
          </h2>
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${REPORT_STATUS_STYLE[r.status]}`}>
            {REPORT_STATUSES[r.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          Le {dateTimeOf(r.created_at)} · annonce{" "}
          {listingPublic ? (
            <Link href={`/decks/${r.listing_id}`} className="font-medium text-link hover:underline">
              {r.listing_title}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{r.listing_title}</span>
          )}{" "}
          ({STATUSES[r.listing_status]})
        </p>
        <blockquote className="mt-3 whitespace-pre-line rounded-lg bg-danger-soft px-4 py-3 text-sm">{r.reason}</blockquote>
        {r.handled_at && (
          <p className="mt-2 text-xs text-muted">
            Traité par {r.handler_name ?? "un admin"} le {dateTimeOf(r.handled_at)}.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-line bg-surface">
        <h3 className="border-b border-line px-4 py-3 text-sm font-semibold sm:px-5">
          Conversation <span className="font-normal text-muted">· {messages.length} message{messages.length > 1 ? "s" : ""}</span>
        </h3>
        <ol className="max-h-[60vh] space-y-2 overflow-y-auto px-4 py-4 sm:px-5">
          {messages.map((m, i) => {
            const fromReported = m.sender_id === r.reported_id;
            const newDay = i === 0 || !sameDay(messages[i - 1].created_at, m.created_at);
            return (
              <li key={m.id}>
                {newDay && <p className="py-2 text-center text-xs font-medium first-letter:uppercase text-muted">{dayLabel(m.created_at)}</p>}
                <div className={`rounded-xl px-3.5 py-2 text-sm ${fromReported ? "bg-danger-soft/60" : "bg-sunken"}`}>
                  <p className="text-xs font-semibold">
                    {m.sender_name}
                    {fromReported && <span className="font-normal text-danger"> · signalé</span>}
                    <span className="ml-2 font-normal tabular-nums text-muted">{timeOf(m.created_at)}</span>
                  </p>
                  <p className="mt-0.5 whitespace-pre-line break-words">{m.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <ReportDecision
        key={`${r.status}|${r.admin_note ?? ""}`}
        reportId={r.id}
        status={r.status}
        note={r.admin_note}
        listingWithdrawable={listingPublic}
      />
    </div>
  );
}
