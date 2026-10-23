"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { unreadMessageCount } from "@/app/espace/messages/actions";

/** Bulle de discussion de l'en-tête, avec le nombre de messages non lus, mis à jour régulièrement. */
export function MessagesLink({ initialUnread, everyMs = 30_000 }: { initialUnread: number; everyMs?: number }) {
  const [unread, setUnread] = useState(initialUnread);
  // Le serveur renvoie un nouveau compte à chaque navigation ou rafraîchissement : il fait foi.
  const [seen, setSeen] = useState(initialUnread);
  if (initialUnread !== seen) {
    setSeen(initialUnread);
    setUnread(initialUnread);
  }

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const n = await unreadMessageCount().catch(() => null);
      if (!cancelled && n != null) setUnread(n);
    };
    const timer = setInterval(tick, everyMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [everyMs]);

  const label = unread === 0 ? "Messages" : `Messages, ${unread} non lu${unread > 1 ? "s" : ""}`;
  return (
    <Link
      href="/espace/messages"
      aria-label={label}
      title={label}
      className="relative flex h-9 w-9 items-center justify-center rounded-md text-banner-muted hover:bg-white/10 hover:text-banner-ink"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden className="h-[22px] w-[22px]">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 20.25c4.97 0 9-3.69 9-8.25s-4.03-8.25-9-8.25S3 7.44 3 12c0 2.1.86 4.02 2.27 5.48.43.45.74 1.04.59 1.64a4.5 4.5 0 0 1-.92 1.79A6 6 0 0 0 6 21c1.28 0 2.47-.4 3.45-1.09.81.22 1.67.34 2.55.34Z"
        />
      </svg>
      {unread > 0 && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-reveal px-1 text-center text-[11px] font-bold leading-[18px] tabular-nums text-white ring-2 ring-banner"
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
