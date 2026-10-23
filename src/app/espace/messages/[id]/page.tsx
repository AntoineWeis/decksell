import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getConversation, getMessages, getOffers } from "@/lib/messaging";
import { OfferCard, OfferForm } from "@/components/offer-ui";
import { dayLabel, sameDay, timeOf } from "@/lib/message-dates";
import { formatEur } from "@/lib/pricing";
import { PUBLIC_STATUSES, STATUSES, artCrop } from "@/lib/listings";
import { sendMessage } from "../actions";
import { Avatar } from "@/components/avatar";
import { MessageComposer } from "@/components/message-composer";
import { ConversationTools } from "@/components/conversation-tools";
import { AutoRefresh, MarkRead, ThreadScroller } from "@/components/conversation-live";

type Props = { params: Promise<{ id: string }> };

const OFFER_EVENT = { offer_accepted: "accepté", offer_declined: "refusé", offer_withdrawn: "retiré" } as const;

export const metadata: Metadata = { title: "Conversation" };

export default function ConversationPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="h-[32rem] animate-pulse rounded-xl bg-sunken" aria-busy />}>
      <Conversation params={params} />
    </Suspense>
  );
}

async function Conversation({ params }: Props) {
  const { id } = await params;
  const user = await requireUser(`/espace/messages/${id}`);
  const c = await getConversation(id);
  if (!c) notFound();
  const [messages, offers] = await Promise.all([getMessages(c.id), getOffers(c.id)]);
  const accepted = [...offers.values()].filter((o) => o.status === "accepted").at(-1);

  const isPublic = (PUBLIC_STATUSES as readonly string[]).includes(c.listing_status);
  const listingHref = c.role === "seller" ? `/espace/annonces/${c.listing_id}` : isPublic ? `/decks/${c.listing_id}` : null;
  const cover = artCrop(c.listing_cover_image_url);
  const canReply = !c.blocked_by_me && !c.blocked_me;

  return (
    <div className="space-y-4">
      <MarkRead conversationId={c.id} unread={c.unread} />
      <AutoRefresh />

      <Link href="/espace/messages" className="inline-block text-sm text-muted hover:text-foreground">
        ← Tous les messages
      </Link>

      {/* L'annonce et l'autre membre */}
      <section className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
        {cover && (
          <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-sunken">
            <Image src={cover} alt="" fill sizes="80px" unoptimized className="object-cover" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {listingHref ? (
              <Link href={listingHref} className="hover:text-link hover:underline">
                {c.listing_title}
              </Link>
            ) : (
              c.listing_title
            )}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="font-medium tabular-nums text-foreground">{formatEur(c.listing_asking_cents)}</span>
            {c.listing_status !== "active" && (
              <span className="rounded-md bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">{STATUSES[c.listing_status]}</span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm">
          <Avatar name={c.other_name} url={c.other_avatar_url} size={32} />
          <div className="hidden sm:block">
            <p className="font-semibold leading-tight">
              {c.role === "buyer" ? (
                <Link href={`/vendeurs/${c.other_id}`} className="hover:text-link hover:underline">
                  {c.other_name}
                </Link>
              ) : (
                c.other_name
              )}
            </p>
            <p className="text-xs text-muted">{c.role === "buyer" ? "Vendeur" : "Acheteur"}</p>
          </div>
        </div>
      </section>

      {accepted && (
        <p className="rounded-lg border border-ok/30 bg-ok-soft px-4 py-3 text-sm text-ok">
          <strong className="font-semibold">Offre acceptée : {formatEur(accepted.amount_cents)}.</strong>{" "}
          {c.role === "seller" ? (
            <>
              Convenez de la remise et du paiement ici. Pense à passer l&apos;annonce en « Réservé » depuis{" "}
              <Link href="/espace" className="font-semibold underline">
                Mes annonces
              </Link>
              .
            </>
          ) : (
            "Convenez avec le vendeur de la remise et du paiement ici. Le paiement en ligne n'est pas encore proposé sur decksell."
          )}
        </p>
      )}

      {/* Rappel anti-arnaque, toujours visible */}
      <p className="rounded-lg bg-brand-soft px-4 py-3 text-sm text-link">
        <strong className="font-semibold">Pour une vente sereine :</strong> préfère la remise en main propre ou un
        paiement protégé. Ne paie jamais en « PayPal entre proches » et méfie-toi des liens envoyés par message.
      </p>

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <ThreadScroller lastId={messages.at(-1)?.id ?? null}>
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Aucun message.</p>
          ) : (
            <ol className="space-y-2">
              {messages.map((m, i) => {
                const mine = m.sender_id === user.id;
                const prev = messages[i - 1];
                const newDay = !prev || !sameDay(prev.created_at, m.created_at);
                return (
                  <li key={m.id}>
                    {newDay && (
                      <p className="py-2 text-center text-xs font-medium first-letter:uppercase text-muted">{dayLabel(m.created_at)}</p>
                    )}
                    {m.kind === "offer" && m.offer_id != null && offers.has(m.offer_id) ? (
                      <OfferCard offer={offers.get(m.offer_id)!} viewer={c.role} askingCents={c.listing_asking_cents} mine={mine} />
                    ) : m.kind !== "text" && m.kind !== "offer" ? (
                      <p className="py-1 text-center text-xs text-muted">
                        <span className="font-medium text-foreground">{mine ? "Tu as" : `${c.other_name} a`}</span>{" "}
                        {OFFER_EVENT[m.kind]} l&apos;offre
                        {m.offer_id != null && offers.has(m.offer_id) && ` de ${formatEur(offers.get(m.offer_id)!.amount_cents)}`} ·{" "}
                        {timeOf(m.created_at)}
                      </p>
                    ) : (
                    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 sm:max-w-[70%] ${
                          mine ? "rounded-br-md bg-accent text-on-accent" : "rounded-bl-md bg-sunken"
                        }`}
                      >
                        <p className="whitespace-pre-line break-words text-[15px] leading-relaxed">{m.body}</p>
                        <p className={`mt-0.5 text-right text-[11px] tabular-nums ${mine ? "text-on-accent/75" : "text-muted"}`}>
                          <span className="sr-only">{mine ? "Toi, " : `${c.other_name}, `}</span>
                          {timeOf(m.created_at)}
                        </p>
                      </div>
                    </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </ThreadScroller>

        <div className="border-t border-line p-4 sm:p-5">
          {canReply ? (
            <>
              <MessageComposer action={sendMessage.bind(null, c.id)} label={`Ta réponse à ${c.other_name}`} placeholder="Ta réponse…" />
              {c.role === "buyer" && isPublic && <OfferForm conversationId={c.id} askingCents={c.listing_asking_cents} />}
            </>
          ) : (
            <p className="text-sm text-muted">
              {c.blocked_by_me
                ? `Tu as bloqué ${c.other_name} : vous ne pouvez plus vous écrire.`
                : "Cette conversation est fermée : tu ne peux plus y répondre."}
            </p>
          )}
        </div>
      </section>

      <ConversationTools conversationId={c.id} otherName={c.other_name} blockedByMe={c.blocked_by_me} />
    </div>
  );
}
