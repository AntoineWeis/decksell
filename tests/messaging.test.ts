import { test } from "node:test";
import assert from "node:assert/strict";
import { containsContactInfo, isUuid } from "../src/lib/messaging-shared.ts";
import { dayLabel, sameDay, shortDate } from "../src/lib/message-dates.ts";

test("repère un email ou un numéro de téléphone", () => {
  assert.equal(containsContactInfo("écris-moi à jean.dupont+mtg@gmail.com"), true);
  assert.equal(containsContactInfo("appelle le 06 12 34 56 78"), true);
  assert.equal(containsContactInfo("ou le +33 6 12 34 56 78"), true);
  assert.equal(containsContactInfo("0612345678"), true);
});

test("ne signale pas un message ordinaire", () => {
  assert.equal(containsContactInfo("Bonjour, le deck est-il dispo ? Je propose 450 €, 4 Ragavan."), false);
  assert.equal(containsContactInfo("Rendez-vous le 12/11 à 18 h"), false);
});

test("valide les identifiants", () => {
  assert.equal(isUuid("4c35b39d-197f-450c-9c4b-a534f3ca0aa6"), true);
  assert.equal(isUuid("../espace"), false);
  assert.equal(isUuid(undefined), false);
});

test("dates à l'heure de Paris", () => {
  const now = new Date("2026-10-23T12:00:00Z");
  // 23 h 30 UTC le 22 = 1 h 30 le 23 à Paris : c'est aujourd'hui.
  assert.equal(dayLabel("2026-10-22T23:30:00Z", now), "Aujourd'hui");
  assert.equal(shortDate("2026-10-22T23:30:00Z", now), "01:30");
  assert.equal(dayLabel("2026-10-22T08:00:00Z", now), "Hier");
  assert.equal(shortDate("2026-10-22T08:00:00Z", now), "hier");
  assert.equal(sameDay("2026-10-22T21:00:00Z", "2026-10-22T23:30:00Z"), false);
});
