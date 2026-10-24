import { test } from "node:test";
import assert from "node:assert/strict";
import { BADGE_BY_KEY, badgeChanges, computeBadges, levelFor, nextStep, topBadges, type BadgeStats } from "../src/lib/badges.ts";

const base: BadgeStats = {
  medianReplyHours: null,
  fairPriceListings: 0,
  accountAgeDays: 10,
  listings: 0,
  hasNeatListing: false,
  hasMetaListing: false,
  distinctArchetypes: 0,
  profileComplete: false,
};

test("un nouveau membre sans annonce n'a aucun badge", () => {
  assert.deepEqual(computeBadges(base), []);
});

test("les badges à niveaux suivent leurs seuils, y compris « plus bas = mieux »", () => {
  const reactive = BADGE_BY_KEY.get("reactive")!;
  assert.equal(levelFor(reactive, 30), 0);
  assert.equal(levelFor(reactive, 20), 1);
  assert.equal(levelFor(reactive, 5), 2);
  assert.equal(levelFor(reactive, 0.5), 3);
  assert.equal(levelFor(reactive, null), 0);
  const fair = BADGE_BY_KEY.get("fair-price")!;
  assert.deepEqual([0, 1, 4, 5, 15, 40].map((v) => levelFor(fair, v)), [0, 1, 1, 2, 3, 3]);
});

test("computeBadges réunit tous les badges mérités", () => {
  const earned = computeBadges({
    ...base,
    medianReplyHours: 3,
    fairPriceListings: 5,
    accountAgeDays: 400,
    listings: 7,
    hasNeatListing: true,
    hasMetaListing: true,
    distinctArchetypes: 3,
    profileComplete: true,
  });
  assert.deepEqual(earned, [
    { key: "reactive", level: 2 },
    { key: "fair-price", level: 2 },
    { key: "veteran", level: 2 },
    { key: "neat-listing", level: 1 },
    { key: "meta-list", level: 1 },
    { key: "collector", level: 1 },
    { key: "first-steps", level: 1 },
    { key: "estimator", level: 1 },
  ]);
});

test("l'ancienneté ne compte qu'avec au moins une annonce", () => {
  assert.deepEqual(computeBadges({ ...base, accountAgeDays: 900 }), []);
});

test("badgeChanges ne garde que les nouveautés et les montées de niveau, sans jamais retirer", () => {
  const prev = [{ key: "fair-price", level: 1 }, { key: "estimator", level: 1 }];
  const next = [{ key: "fair-price", level: 2 }, { key: "estimator", level: 1 }, { key: "meta-list", level: 1 }];
  assert.deepEqual(badgeChanges(prev, next), [{ key: "fair-price", level: 2 }, { key: "meta-list", level: 1 }]);
  assert.deepEqual(badgeChanges(prev, []), []);
});

test("nextStep indique ce qu'il reste pour le niveau suivant", () => {
  const fair = BADGE_BY_KEY.get("fair-price")!;
  assert.deepEqual(nextStep(fair, { ...base, fairPriceListings: 3 }), { level: 2, remaining: 2 });
  assert.equal(nextStep(fair, { ...base, fairPriceListings: 20 }), null);
  assert.equal(nextStep(BADGE_BY_KEY.get("estimator")!, base), null);
});

test("topBadges met la confiance en avant", () => {
  const top = topBadges([{ key: "estimator", level: 1 }, { key: "meta-list", level: 1 }, { key: "reactive", level: 1 }, { key: "veteran", level: 3 }], 3);
  assert.deepEqual(top.map((b) => b.key), ["veteran", "reactive", "meta-list"]);
});
