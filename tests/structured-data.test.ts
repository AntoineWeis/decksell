import { test } from "node:test";
import assert from "node:assert/strict";
import { deckProductJsonLd, jsonLdScript } from "../src/lib/structured-data.ts";
import type { PublicListing } from "../src/lib/listings.ts";

const listing = {
  id: "x", title: "Azorius </script> Control", format: "modern", card_count: 75, condition: "near_mint",
  asking_cents: 61800, status: "reserved", cover_image_url: "https://img/x.jpg",
  archetype: { id: 1, slug: "azorius-control", name: "Azorius Control" },
  seller: { id: "s", display_name: "Bosetti", avatar_url: null, moxfield_url: null, archidekt_url: null },
} as unknown as PublicListing;

test("deckProductJsonLd décrit le deck comme un produit d'occasion, avec son prix en euros", () => {
  const d = deckProductJsonLd(listing, "https://decksell.fr/decks/x") as { offers: Record<string, unknown> };
  assert.equal(d.offers.price, "618.00");
  assert.equal(d.offers.priceCurrency, "EUR");
  assert.equal(d.offers.availability, "https://schema.org/LimitedAvailability");
  assert.deepEqual(d.offers.seller, { "@type": "Person", name: "Bosetti" });
});

test("jsonLdScript ne laisse jamais fermer la balise script", () => {
  assert.ok(!jsonLdScript(deckProductJsonLd(listing, "u")).includes("</script>"));
});
