import "server-only";
import { cache } from "react";
import { getUser } from "./auth.ts";
import { createSupabaseServer } from "./supabase-auth.ts";
import { isUuid } from "./messaging-shared.ts";
import type { ListingStatus } from "./listings.ts";

// Lecture de la messagerie, toujours au nom du membre connecté (RLS et fonctions SQL) :
// jamais avec la clé secrète.

/** Une conversation vue par le membre connecté (renvoyée par list_conversations). */
export type ConversationSummary = {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_status: ListingStatus;
  listing_asking_cents: number;
  listing_cover_image_url: string | null;
  role: "buyer" | "seller"; // rôle du membre connecté
  other_id: string;
  other_name: string;
  other_avatar_url: string | null;
  created_at: string;
  last_message_at: string;
  last_message_body: string | null;
  last_message_mine: boolean | null;
  unread: boolean;
  blocked_by_me: boolean;
  blocked_me: boolean;
};

export type Message = { id: number; sender_id: string; body: string; created_at: string };

/** Boîte de réception, la plus récente d'abord. Null si la lecture échoue. */
export async function listConversations(): Promise<ConversationSummary[] | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("list_conversations");
  if (error) {
    console.error("Messagerie : lecture des conversations impossible", error.message);
    return null;
  }
  return (data ?? []) as ConversationSummary[];
}

/** Une conversation du membre connecté, ou null (inconnue ou pas la sienne). */
export const getConversation = cache(async (id: string): Promise<ConversationSummary | null> => {
  if (!isUuid(id)) return null;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("list_conversations", { p_id: id });
  if (error) {
    console.error("Messagerie : lecture de la conversation impossible", error.message);
    return null;
  }
  return ((data ?? []) as ConversationSummary[])[0] ?? null;
});

/** Les 500 derniers messages d'une conversation, dans l'ordre chronologique. */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(500);
  if (error) throw new Error(`Lecture des messages impossible : ${error.message}`);
  return ((data ?? []) as Message[]).reverse();
}

/** Nombre de messages reçus non lus du membre connecté (0 si déconnecté ou en cas d'erreur). */
export const getUnreadCount = cache(async (): Promise<number> => {
  const user = await getUser();
  if (!user) return 0;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("unread_count");
  if (error) return 0;
  return typeof data === "number" ? data : 0;
});

/** Conversation déjà ouverte par cet acheteur sur cette annonce, ou null. */
export async function findConversationId(listingId: string, buyerId: string): Promise<string | null> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", buyerId)
    .maybeSingle();
  return data?.id ?? null;
}
