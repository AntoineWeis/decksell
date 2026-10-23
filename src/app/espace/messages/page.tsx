import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { listConversations } from "@/lib/messaging";
import { shortDate } from "@/lib/message-dates";
import { artCrop } from "@/lib/listings";
import { Avatar } from "@/components/avatar";
import { AutoRefresh } from "@/components/conversation-live";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <Suspense fallback={<InboxSkeleton />}>
      <Inbox />
    </Suspense>
  );
}

async function Inbox() {
  await requireUser("/espace/messages");
  const conversations = await listConversations();

  if (!conversations) {
    return <p className="rounded-xl bg-danger-soft px-5 py-4 text-danger">Impossible de charger tes messages.</p>;
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
        <p className="font-semibold">Aucune conversation pour l&apos;instant</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Quand tu écris à un vendeur, ou qu&apos;un acheteur te contacte sur une de tes annonces, l&apos;échange
          apparaît ici.
        </p>
        <Link
          href="/decks"
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-accent px-4 font-semibold text-on-accent hover:bg-accent-hover"
        >
          Voir les decks en vente
        </Link>
      </div>
    );
  }

  return (
    <>
      <AutoRefresh everyMs={30_000} />
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {conversations.map((c) => {
          const cover = artCrop(c.listing_cover_image_url);
          return (
            <li key={c.id}>
              <Link
                href={`/espace/messages/${c.id}`}
                className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-sunken sm:gap-4 sm:px-5 ${c.unread ? "bg-brand-soft/40" : ""}`}
              >
                <Avatar name={c.other_name} url={c.other_avatar_url} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={`truncate ${c.unread ? "font-bold" : "font-semibold"}`}>
                      {c.other_name}
                      <span className="ml-2 text-xs font-normal text-muted">
                        {c.role === "seller" ? "intéressé par ton annonce" : "vendeur"}
                      </span>
                    </p>
                    <span className={`shrink-0 text-xs tabular-nums ${c.unread ? "font-semibold text-link" : "text-muted"}`}>
                      {shortDate(c.last_message_at)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted">{c.listing_title}</p>
                  {c.last_message_body && (
                    <p className={`mt-0.5 truncate text-sm ${c.unread ? "font-medium text-foreground" : "text-muted"}`}>
                      {c.last_message_mine && <span className="text-muted">Toi : </span>}
                      {c.last_message_body}
                    </p>
                  )}
                </div>
                {cover && (
                  <span className="relative hidden h-12 w-16 shrink-0 overflow-hidden rounded-md bg-sunken sm:block">
                    <Image src={cover} alt="" fill sizes="64px" unoptimized className="object-cover" />
                  </span>
                )}
                {c.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-link" aria-label="Non lu" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function InboxSkeleton() {
  return (
    <div className="space-y-px overflow-hidden rounded-xl border border-line" aria-busy>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[76px] animate-pulse bg-sunken" />
      ))}
    </div>
  );
}
