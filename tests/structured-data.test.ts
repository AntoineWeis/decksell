import { test } from "node:test";
import assert from "node:assert/strict";
import { breadcrumbJsonLd, deckProductJsonLd, jsonLdScript } from "../src/lib/structured-data.ts";
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

test("deckProductJsonLd prend l'aperçu de partage comme image quand le deck n'a pas de photo", () => {
  const d = deckProductJsonLd({ ...listing, cover_image_url: null }, "https://decksell.fr/decks/x");
  assert.equal(d.image, "https://decksell.fr/decks/x/opengraph-image");
});

test("breadcrumbJsonLd numérote les étapes à partir de 1", () => {
  const d = breadcrumbJsonLd([["Accueil", "https://decksell.fr/"], ["Decks en vente", "https://decksell.fr/decks"]]) as {
    itemListElement: { position: number; name: string; item: string }[];
  };
  assert.deepEqual(d.itemListElement.map((i) => i.position), [1, 2]);
  assert.equal(d.itemListElement[1].item, "https://decksell.fr/decks");
});
