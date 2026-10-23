"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markRead } from "@/app/espace/messages/actions";

/** Recharge la page à intervalle régulier tant qu'elle est visible, pour voir arriver les réponses. */
export function AutoRefresh({ everyMs = 15_000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(tick, everyMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, everyMs]);
  return null;
}

/** Marque la conversation comme lue dès qu'elle est affichée avec un message non lu. */
export function MarkRead({ conversationId, unread }: { conversationId: string; unread: boolean }) {
  useEffect(() => {
    if (unread) void markRead(conversationId);
  }, [conversationId, unread]);
  return null;
}

/** Fil de messages qui défile jusqu'au dernier message à l'ouverture et à chaque nouveau message. */
export function ThreadScroller({ lastId, children }: { lastId: number | null; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastId]);
  return (
    <div ref={ref} className="max-h-[60vh] overflow-y-auto px-4 py-4 sm:px-5" tabIndex={0} aria-label="Messages">
      {children}
    </div>
  );
}
