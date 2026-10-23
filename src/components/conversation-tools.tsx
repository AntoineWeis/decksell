"use client";

import { useState, useTransition, type FormEvent } from "react";
import { reportConversation, setBlocked } from "@/app/espace/messages/actions";
import { REPORT_MAX } from "@/lib/messaging-shared";
import { useToast } from "./toaster";

/** Bloquer ou débloquer l'autre membre, et signaler la conversation. */
export function ConversationTools({
  conversationId,
  otherName,
  blockedByMe,
}: {
  conversationId: string;
  otherName: string;
  blockedByMe: boolean;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [reason, setReason] = useState("");

  function toggleBlock() {
    if (!blockedByMe && !confirm(`Bloquer ${otherName} ? Vous ne pourrez plus vous écrire, sur aucune annonce.`)) return;
    start(async () => {
      const r = await setBlocked(conversationId, !blockedByMe);
      if (r.status === "error") toast("error", r.message);
      else toast("success", blockedByMe ? `${otherName} est débloqué` : `${otherName} est bloqué`);
    });
  }

  function sendReport(e: FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("reason", reason);
    start(async () => {
      const r = await reportConversation(conversationId, fd);
      if (r.status === "error") {
        toast("error", r.message);
        return;
      }
      setReported(true);
      setReportOpen(false);
      toast("success", "Signalement envoyé. Merci, nous allons regarder.");
    });
  }

  return (
    <div className="text-sm">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <button type="button" onClick={toggleBlock} disabled={pending} className="text-muted hover:text-danger disabled:opacity-50">
          {blockedByMe ? `Débloquer ${otherName}` : `Bloquer ${otherName}`}
        </button>
        {!reported && !reportOpen && (
          <button type="button" onClick={() => setReportOpen(true)} className="text-muted hover:text-danger">
            Signaler la conversation
          </button>
        )}
        {reported && <span className="text-muted">Conversation signalée</span>}
      </div>
      {reportOpen && (
        <form onSubmit={sendReport} className="mt-3 space-y-2 rounded-xl border border-line bg-surface p-4">
          <label className="block">
            <span className="mb-1.5 block font-medium">Qu&apos;est-ce qui ne va pas ?</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={REPORT_MAX}
              placeholder="Arnaque, insultes, spam…"
              className="block w-full rounded-xl border border-line bg-sunken px-3 py-2.5 outline-none focus:border-link focus:ring-2 focus:ring-link/25"
            />
          </label>
          <p className="text-xs text-muted">
            En signalant, tu autorises decksell à lire cette conversation pour traiter le problème.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending || reason.trim() === ""}
              className="h-9 rounded-lg bg-danger px-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-40"
            >
              {pending ? "Envoi…" : "Envoyer le signalement"}
            </button>
            <button type="button" onClick={() => setReportOpen(false)} className="h-9 rounded-lg px-3 text-muted hover:text-foreground">
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
