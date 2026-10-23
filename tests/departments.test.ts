import { test } from "node:test";
import assert from "node:assert/strict";
import { deliveryLabel, formatLocation, isDepartment } from "../src/lib/departments.ts";

test("formatLocation affiche la ville, sinon le département, avec le code", () => {
  assert.equal(formatLocation("69", "Lyon"), "Lyon (69)");
  assert.equal(formatLocation("2A", ""), "Corse-du-Sud (2A)");
  assert.equal(formatLocation(null, "Genève"), "Genève");
  assert.equal(formatLocation("99", null), null);
  assert.equal(isDepartment("974"), true);
  assert.equal(isDepartment("toString"), false);
});

test("deliveryLabel liste les modes de remise", () => {
  assert.equal(deliveryLabel(true, true), "Remise en main propre · Envoi possible");
  assert.equal(deliveryLabel(false, true), "Envoi possible");
  assert.equal(deliveryLabel(false, false), null);
});
