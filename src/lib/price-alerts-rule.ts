// Règle des alertes de baisse de prix. Fonction pure, testée dans tests/price-alerts.test.ts.

const ONE_DAY = 24 * 60 * 60 * 1000;

/** Membres à prévenir : inscrits aux alertes, et sans alerte pour ce deck depuis 24 h. */
export function dueForAlert(
  favorites: { user_id: string; price_alert_at: string | null }[],
  optedIn: Set<string>,
  now = Date.now(),
): string[] {
  return favorites
    .filter((f) => optedIn.has(f.user_id) && (!f.price_alert_at || now - new Date(f.price_alert_at).getTime() >= ONE_DAY))
    .map((f) => f.user_id);
}
