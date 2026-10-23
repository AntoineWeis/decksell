import "server-only";
import { cache } from "react";
import { getUser } from "./auth.ts";
import { createSupabaseServer } from "./supabase-auth.ts";
import type { ListingStatus } from "./listings.ts";
import type { MessageKind } from "./messaging.ts";

// Modération : tout passe par des fonctions SQL qui revérifient que le membre est admin.

export type ReportStatus = "open" | "resolved" | "dismissed";

export const REPORT_STATUSES: Record<ReportStatus, string> = {
  open: "À traiter",
  resolved: "Résolu",
  dismissed: "Sans suite",
};

export const REPORT_STATUS_STYLE: Record<ReportStatus, string> = {
  open: "bg-danger-soft text-danger",
  resolved: "bg-ok-soft text-ok",
  dismissed: "bg-sunken text-muted",
};

export type Report = {
  id: number;
  /** Conversation signalée, ou annonce signalée depuis sa page. */
  kind: "conversation" | "listing";
  /** Signalé par un membre, ou repéré automatiquement (insulte) : alors sans auteur. */
  source: "member" | "auto";
  reason: string;
  status: ReportStatus;
  created_at: string;
  handled_at: string | null;
  handler_name: string | null;
  admin_note: string | null;
  conversation_id: string | null;
  listing_id: string;
  listing_title: string;
  listing_status: ListingStatus;
  reporter_id: string | null;
  reporter_name: string | null;
  reported_id: string;
  reported_name: string;
  reported_role: "buyer" | "seller";
  reported_suspended_until: string | null;
  message_count: number;
};

export type ReportMessage = { id: number; sender_id: string; sender_name: string; body: string; kind: MessageKind; created_at: string };

/** Vrai si le membre connecté est admin (faux en cas d'erreur ou de base pas encore migrée). */
export const isAdmin = cache(async (): Promise<boolean> => {
  const user = await getUser();
  if (!user) return false;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
});

export async function listReports(status: ReportStatus | null): Promise<Report[] | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("admin_list_reports", { p_status: status });
  if (error) {
    console.error("Modération : lecture des signalements impossible", error.message);
    return null;
  }
  return (data ?? []) as Report[];
}

/** Nombre de signalements à traiter (0 si le membre n'est pas admin). */
export const openReportCount = cache(async (): Promise<number> => {
  if (!(await isAdmin())) return 0;
  return (await listReports("open"))?.length ?? 0;
});

export async function getReport(id: number): Promise<{ report: Report; messages: ReportMessage[] } | null> {
  const supabase = await createSupabaseServer();
  const [report, messages] = await Promise.all([
    supabase.rpc("admin_list_reports", { p_id: id }),
    supabase.rpc("admin_report_messages", { p_report_id: id }),
  ]);
  if (report.error || messages.error) {
    console.error("Modération : lecture du signalement impossible", report.error?.message ?? messages.error?.message);
    return null;
  }
  const row = ((report.data ?? []) as Report[])[0];
  return row ? { report: row, messages: (messages.data ?? []) as ReportMessage[] } : null;
}

/** Titre d'un signalement : qui signale qui (ou quoi). */
export function reportTitle(r: Pick<Report, "kind" | "source" | "reporter_name" | "reported_name">): string {
  if (r.source === "auto") return `Message de ${r.reported_name} repéré automatiquement`;
  if (r.kind === "listing") return `${r.reporter_name ?? "Un membre"} signale l'annonce de ${r.reported_name}`;
  return `${r.reporter_name ?? "Un membre"} signale ${r.reported_name}`;
}

/** Vrai si le membre visé est suspendu en ce moment. */
export const isSuspendedNow = (until: string | null) => !!until && new Date(until).getTime() > Date.now();
