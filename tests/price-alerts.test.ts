import { test } from "node:test";
import assert from "node:assert/strict";

test("dueForAlert : membres inscrits aux alertes, une alerte par jour au plus", async () => {
  const { dueForAlert } = await import("../src/lib/price-alerts-rule.ts");
  const now = Date.parse("2026-10-23T12:00:00Z");
  const favs = [
    { user_id: "a", price_alert_at: null },
    { user_id: "b", price_alert_at: "2026-10-23T08:00:00Z" }, // il y a 4 h
    { user_id: "c", price_alert_at: "2026-10-21T08:00:00Z" }, // il y a 2 jours
    { user_id: "d", price_alert_at: null }, // pas inscrit
  ];
  assert.deepEqual(dueForAlert(favs, new Set(["a", "b", "c"]), now), ["a", "c"]);
});
