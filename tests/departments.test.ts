import { test } from "node:test";
import assert from "node:assert/strict";
import { formatLocation, isDepartment } from "../src/lib/departments.ts";

test("formatLocation affiche la ville, sinon le département, avec le code", () => {
  assert.equal(formatLocation("69", "Lyon"), "Lyon (69)");
  assert.equal(formatLocation("2A", ""), "Corse-du-Sud (2A)");
  assert.equal(formatLocation(null, "Genève"), "Genève");
  assert.equal(formatLocation("99", null), null);
  assert.equal(isDepartment("974"), true);
  assert.equal(isDepartment("toString"), false);
});
