"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getProfile, getUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { getConversation, getUnreadCount } from "@/lib/messaging";
import { MESSAGE_MAX, REPORT_MAX, isUuid } from "@/lib/messaging-shared";
import { notifyNewMessage } from "@/lib/email";
import { setFlash } from "@/lib/flash";
import { parseEur } from "@/lib/pricing";
import { refreshUserBadges } from "@/lib/badges-server";

// Chaque action revérifie le membre ; les fonctions SQL revérifient tout le reste
// (participant, blocage, quotas, email confirmé).

export type MessageResult = { status: "sent" } | { status: "error"; message: string };

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const NOT_LOGGED: MessageResult = { status: "error", message: "Ta session a expiré. Reconnecte-toi." };

/** Codes d'erreur renvoyés par les fonctions SQL, traduits pour le membre. */
const SQL_ERRORS: Record<string, string> = {
  not_authenticated: "Ta session a expiré. Reconnecte-toi.",
  invalid_body: `Écris un message de 1 à ${MESSAGE_MAX} caractères.`,
  email_not_confirmed: "Confirme ton adresse email (lien reçu à l'inscription) avant d'écrire à un vendeur.",
  listing_unavailable: "Cette annonce n'est plus disponible.",
  own_listing: "C'est ton annonce : tu ne peux pas t'écrire à toi-même.",
  blocked: "Cet échange n'est plus possible.",
  suspended: "Ton compte est suspendu par la modération : tu ne peux plus envoyer de message pour l'instant.",
  quota_conversations: "Tu as contacté beaucoup de vendeurs aujourd'hui. Réessaie demain.",
  quota_messages: "Tu as envoyé beaucoup de messages en peu de temps. Patiente un peu avant de réessayer.",
  not_found: "Conversation introuvable.",
  not_buyer: "Seul l'acheteur peut faire une offre.",
  invalid_amount: "Indique un montant valide.",
  offer_closed: "Cette offre a déjà reçu une réponse ou a été retirée.",
};

function failure(context: string, error: { message: string }): MessageResult {
  const code = Object.keys(SQL_ERRORS).find((k) => error.message.includes(k));
  if (code) return { status: "error", message: SQL_ERRORS[code] };
  console.error(`Messagerie : ${context}`, error.message);
  return { status: "error", message: "Envoi impossible. Réessaie dans un instant." };
}

function readBody(formData: FormData): string | null {
  const body = str(formData.get("body"));
  return body.length >= 1 && body.length <= MESSAGE_MAX ? body : null;
}

/** Prévient le destinataire par email, après la réponse (sans faire attendre l'expéditeur). */
async function scheduleNotification(conversationId: string, recipientId: string | null) {
  if (!recipientId) return;
  const [conversation, me] = await Promise.all([getConversation(conversationId), getProfile()]);
  if (!conversation || !me) return;
  after(() =>
    notifyNewMessage({
      recipientId,
      senderName: me.displayName,
      listingTitle: conversation.listing_title,
      conversationId,
    }),
  );
}

/** Premier message d'un acheteur depuis la page d'une annonce. */
export async function startConversation(listingId: string, formData: FormData): Promise<MessageResult> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;
  if (!isUuid(listingId)) return { status: "error", message: SQL_ERRORS.listing_unavailable };
  const body = readBody(formData);
  if (!body) return { status: "error", message: SQL_ERRORS.invalid_body };

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .rpc("start_conversation", { p_listing_id: listingId, p_body: body })
    .single<{ conversation_id: string; notify_user: string | null }>();
  if (error || !data) return failure("ouverture de conversation impossible", error ?? { message: "" });

  await scheduleNotification(data.conversation_id, data.notify_user);
  await setFlash("success", "Message envoyé au vendeur");
  redirect(`/espace/messages/${data.conversation_id}`);
}

/** Réponse dans une conversation. */
export async function sendMessage(conversationId: string, formData: FormData): Promise<MessageResult> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;
  if (!isUuid(conversationId)) return { status: "error", message: SQL_ERRORS.not_found };
  const body = readBody(formData);
  if (!body) return { status: "error", message: SQL_ERRORS.invalid_body };

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .rpc("send_message", { p_conversation_id: conversationId, p_body: body })
    .single<{ conversation_id: string; notify_user: string | null }>();
  if (error || !data) return failure("envoi impossible", error ?? { message: "" });

  // Une réponse du vendeur peut faire gagner « Réactif » (calculé après la réponse).
  after(() => refreshUserBadges(user.id));
  await scheduleNotification(conversationId, data.notify_user);
  refresh();
  return { status: "sent" };
}

type PostResult = { conversation_id: string; notify_user: string | null };

/** Appelle une fonction SQL d'offre, puis prévient l'autre membre et recharge la page. */
async function runOffer(context: string, fn: string, args: Record<string, unknown>): Promise<MessageResult> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc(fn, args).single<PostResult>();
  if (error || !data) return failure(context, error ?? { message: "" });
  await scheduleNotification(data.conversation_id, data.notify_user);
  refresh();
  return { status: "sent" };
}

/** Offre de prix de l'acheteur (montant en euros, « 450 » ou « 450,50 »). */
export async function makeOffer(conversationId: string, formData: FormData): Promise<MessageResult> {
  if (!isUuid(conversationId)) return { status: "error", message: SQL_ERRORS.not_found };
  const cents = parseEur(str(formData.get("amount")));
  if (cents == null || cents <= 0 || cents > 10_000_000) return { status: "error", message: SQL_ERRORS.invalid_amount };
  return runOffer("offre impossible", "make_offer", { p_conversation_id: conversationId, p_amount_cents: cents });
}

/** Le vendeur accepte ou refuse une offre. */
export async function respondOffer(offerId: number, accept: boolean): Promise<MessageResult> {
  if (!Number.isSafeInteger(offerId) || offerId <= 0) return { status: "error", message: SQL_ERRORS.not_found };
  return runOffer("réponse à l'offre impossible", "respond_offer", { p_offer_id: offerId, p_accept: accept });
}

/** L'acheteur retire son offre en attente. */
export async function withdrawOffer(offerId: number): Promise<MessageResult> {
  if (!Number.isSafeInteger(offerId) || offerId <= 0) return { status: "error", message: SQL_ERRORS.not_found };
  return runOffer("retrait de l'offre impossible", "withdraw_offer", { p_offer_id: offerId });
}

/** Nombre de messages non lus, relu régulièrement par la bulle de l'en-tête. */
export async function unreadMessageCount(): Promise<number> {
  return getUnreadCount();
}

/** Marque la conversation comme lue pour le membre connecté. */
export async function markRead(conversationId: string): Promise<void> {
  const user = await getUser();
  if (!user || !isUuid(conversationId)) return;
  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("mark_read", { p_conversation_id: conversationId });
  if (error) console.error("Messagerie : marquage comme lu impossible", error.message);
  refresh(); // met à jour le compteur de l'en-tête
}

/** Bloque (ou débloque) l'autre participant d'une conversation. */
export async function setBlocked(conversationId: string, blocked: boolean): Promise<MessageResult> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;
  const conversation = await getConversation(conversationId);
  if (!conversation) return { status: "error", message: SQL_ERRORS.not_found };

  const supabase = await createSupabaseServer();
  const { error } = blocked
    ? await supabase
        .from("blocks")
        .upsert({ blocker_id: user.id, blocked_id: conversation.other_id }, { ignoreDuplicates: true })
    : await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", conversation.other_id);
  if (error) {
    console.error("Messagerie : blocage impossible", error.message);
    return { status: "error", message: "Enregistrement impossible. Réessaie." };
  }
  refresh();
  return { status: "sent" };
}

/** Signale une conversation (traitée à la main en attendant l'outil de modération). */
export async function reportConversation(conversationId: string, formData: FormData): Promise<MessageResult> {
  const user = await getUser();
  if (!user) return NOT_LOGGED;
  if (!isUuid(conversationId)) return { status: "error", message: SQL_ERRORS.not_found };
  const reason = str(formData.get("reason"));
  if (reason.length < 1 || reason.length > REPORT_MAX) {
    return { status: "error", message: `Explique le problème en ${REPORT_MAX} caractères au plus.` };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: user.id, conversation_id: conversationId, reason });
  if (error) {
    if (error.code === "23505") return { status: "error", message: "Tu as déjà signalé cette conversation. Merci." };
    console.error("Messagerie : signalement impossible", error.message);
    return { status: "error", message: "Signalement impossible. Réessaie." };
  }
  return { status: "sent" };
}
