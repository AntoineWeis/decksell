import "server-only";
import { getSupabaseAdmin } from "./supabase-server.ts";
import { notifyPriceDrop } from "./email.ts";
import { dueForAlert } from "./price-alerts-rule.ts";

// Alerte de baisse de prix : prévient par email les membres qui suivent l'annonce.
// Lancée après la réponse (after) : une panne d'email ne bloque jamais l'enregistrement.
// Clé secrète : on lit les favoris de tous les membres, ce qu'aucun membre ne peut faire.

export async function alertPriceDrop(a: {
  listingId: string;
  sellerId: string;
  title: string;
  oldCents: number;
  newCents: number;
}): Promise<void> {
  if (a.newCents >= a.oldCents) return;
  const admin = getSupabaseAdmin();
  const { data: favorites, error } = await admin
    .from("favorites")
    .select("user_id, price_alert_at")
    .eq("listing_id", a.listingId)
    .neq("user_id", a.sellerId);
  // Base pas encore migrée (section 18 du schéma) : pas d'alerte.
  if (error || !favorites?.length) return;

  const { data: profiles } = await admin
    .from("profiles")
    .select("id")
    .in("id", favorites.map((f) => f.user_id))
    .eq("price_alerts", true)
    // Comptes non suspendus (ou dont la suspension est terminée).
    .or(`suspended_until.is.null,suspended_until.lt.${new Date().toISOString()}`);
  const due = dueForAlert(favorites, new Set((profiles ?? []).map((p) => p.id)));
  if (due.length === 0) return;

  // Noté d'abord : même si un email échoue, on ne relance pas toute la liste au prochain changement.
  await admin
    .from("favorites")
    .update({ price_alert_at: new Date().toISOString() })
    .eq("listing_id", a.listingId)
    .in("user_id", due);

  await Promise.all(
    due.map((userId) =>
      notifyPriceDrop({ recipientId: userId, listingId: a.listingId, title: a.title, oldCents: a.oldCents, newCents: a.newCents }),
    ),
  );
}
