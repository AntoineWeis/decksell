"use server";

import { refresh } from "next/cache";
import { getUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { after } from "next/server";
import type { FormState } from "@/app/espace/actions";
import { notifyModeration } from "@/lib/email";

/** Durées de suspension proposées (jours). -1 : lever la suspension en cours. */
const SUSPENSIONS = new Set([0, 3, 7, 30, 3650, -1]);

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/** Classe un signalement (résolu, sans suite ou de nouveau à traiter), avec une note et le retrait éventuel de l'annonce. */
export async function handleReport(reportId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { status: "error", message: "Ta session a expiré. Reconnecte-toi." };
  const status = str(formData.get("status"));
  if (!["open", "resolved", "dismissed"].includes(status)) return { status: "error", message: "Choisis une décision." };
  const note = str(formData.get("note"));
  if (note.length > 1000) return { status: "error", message: "Note trop longue (1000 caractères max)." };
  const suspendDays = Number(str(formData.get("suspend_days")) || "0");
  if (!SUSPENSIONS.has(suspendDays)) return { status: "error", message: "Durée de suspension inconnue." };
  const warn = formData.get("warn") === "on";
  const message = str(formData.get("member_message"));
  if (message.length > 1000) return { status: "error", message: "Message au membre trop long (1000 caractères max)." };

  const supabase = await createSupabaseServer();
  const { data: target, error } = await supabase.rpc("admin_handle_report", {
    p_report_id: reportId,
    p_status: status,
    p_note: note,
    p_withdraw_listing: formData.get("withdraw_listing") === "on",
    p_suspend_days: suspendDays,
  });
  if (error) {
    if (error.message.includes("forbidden")) return { status: "error", message: "Réservé aux admins." };
    console.error("Modération : traitement impossible", error.message);
    return { status: "error", message: "Enregistrement impossible. Réessaie." };
  }
  // Avertissement (ou suspension) : le membre visé est prévenu par email, après la réponse.
  if (typeof target === "string" && (warn || suspendDays > 0)) {
    const suspendedUntil = suspendDays > 0 ? new Date(Date.now() + suspendDays * 86_400_000) : null;
    after(() => notifyModeration({ recipientId: target, note: message, suspendedUntil }).catch((e) => console.error(e)));
  }
  refresh();
  return { status: "saved" };
}
