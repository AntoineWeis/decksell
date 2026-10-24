// Calcul des badges d'un membre à partir de la base. Partagé par le site (après une action)
// et par l'import nocturne (tous les membres). Le client Supabase (clé secrète) est fourni par
// l'appelant : on lit les conversations et annonces de n'importe quel membre.

import type { SupabaseClient } from "@supabase/supabase-js";
import { badgeChanges, computeBadges, type BadgeStats, type EarnedBadge } from "./badges.ts";
import { priceGauge } from "./price-gauge.ts";

const HOUR = 3_600_000;

/** Temps médian de première réponse du vendeur, sur ses 10 dernières conversations (null sous 3 réponses). */
async function medianReplyHours(db: SupabaseClient, userId: string): Promise<number | null> {
  const { data: convs } = await db
    .from("conversations")
    .select("id")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (!convs?.length) return null;
  const { data: messages } = await db
    .from("messages")
    .select("conversation_id, sender_id, created_at")
    .in("conversation_id", convs.map((c) => c.id))
    .order("created_at", { ascending: true });
  const delays: number[] = [];
  for (const c of convs) {
    const thread = (messages ?? []).filter((m) => m.conversation_id === c.id);
    const firstBuyer = thread.find((m) => m.sender_id !== userId);
    if (!firstBuyer) continue;
    const reply = thread.find((m) => m.sender_id === userId && m.created_at > firstBuyer.created_at);
    if (reply) delays.push((Date.parse(reply.created_at) - Date.parse(firstBuyer.created_at)) / HOUR);
  }
  if (delays.length < 3) return null;
  delays.sort((a, b) => a - b);
  const mid = Math.floor(delays.length / 2);
  return delays.length % 2 ? delays[mid] : (delays[mid - 1] + delays[mid]) / 2;
}

/** Faits utiles aux badges d'un membre. */
export async function gatherBadgeStats(db: SupabaseClient, userId: string): Promise<BadgeStats | null> {
  const [{ data: profile }, { data: listings }, reply] = await Promise.all([
    db.from("profiles").select("created_at, avatar_url, display_name, department").eq("id", userId).maybeSingle(),
    db
      .from("listings")
      .select("asking_cents, estimated_cents, card_details, colors, archetype_id, description, meta_score, meta_status, meta_archetype")
      .eq("seller_id", userId),
    medianReplyHours(db, userId),
  ]);
  if (!profile) return null;
  const rows = listings ?? [];
  const archetypes = new Set(rows.map((l) => (l.archetype_id != null ? `id:${l.archetype_id}` : l.meta_archetype ? `meta:${l.meta_archetype}` : null)).filter(Boolean));
  return {
    medianReplyHours: reply,
    fairPriceListings: rows.filter((l) => priceGauge(l.asking_cents, l.estimated_cents)?.verdict === "fair").length,
    accountAgeDays: Math.floor((Date.now() - Date.parse(profile.created_at)) / (24 * HOUR)),
    listings: rows.length,
    hasNeatListing: rows.some(
      (l) => Array.isArray(l.card_details) && l.card_details.length > 0 && (l.colors ?? []).length > 0 && l.archetype_id != null && !!l.description?.trim(),
    ),
    hasMetaListing: rows.some((l) => (l.meta_score ?? 0) >= 75 && (l.meta_status === "ok" || l.meta_status === "partial")),
    distinctArchetypes: archetypes.size,
    profileComplete: !!profile.avatar_url && !!profile.display_name?.trim() && !!profile.department,
  };
}

/**
 * Recalcule les badges d'un membre et enregistre les nouveautés (nouveau badge ou niveau gagné,
 * avec seen_at vide pour l'animation de déblocage). Renvoie les changements.
 */
export async function refreshBadges(db: SupabaseClient, userId: string): Promise<EarnedBadge[]> {
  const stats = await gatherBadgeStats(db, userId);
  if (!stats) return [];
  const { data: current, error } = await db.from("user_badges").select("badge, level").eq("user_id", userId);
  if (error) return []; // table absente (schéma pas encore à jour)
  const changes = badgeChanges(
    (current ?? []).map((b) => ({ key: b.badge, level: b.level })),
    computeBadges(stats),
  );
  if (changes.length === 0) return [];
  const now = new Date().toISOString();
  const { error: e } = await db
    .from("user_badges")
    .upsert(changes.map((c) => ({ user_id: userId, badge: c.key, level: c.level, earned_at: now, seen_at: null })), { onConflict: "user_id,badge" });
  if (e) {
    console.error("Badges non enregistrés :", e.message);
    return [];
  }
  return changes;
}
