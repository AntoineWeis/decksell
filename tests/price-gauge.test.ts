import { test } from "node:test";
import assert from "node:assert/strict";
import { formatGap, priceGauge } from "../src/lib/price-gauge.ts";

test("priceGauge classe le prix demandé par rapport à la valeur", () => {
  assert.deepEqual(priceGauge(80_00, 100_00), { gap: -20, position: 30, verdict: "deal" });
  assert.deepEqual(priceGauge(104_00, 100_00), { gap: 4, position: 54, verdict: "fair" });
  assert.equal(priceGauge(90_00, 100_00)!.verdict, "deal", "-10 % pile : bonne affaire");
  assert.equal(priceGauge(110_00, 100_00)!.verdict, "high", "+10 % pile : au-dessus");
  assert.equal(priceGauge(300_00, 100_00)!.position, 100, "au-delà de +50 % : repère collé à droite");
  assert.equal(priceGauge(10_00, 0), null);
});

test("formatGap écrit le signe moins typographique", () => {
  assert.equal(formatGap(-12), "−12 %");
  assert.equal(formatGap(4), "+4 %");
  assert.equal(formatGap(0), "0 %");
});
