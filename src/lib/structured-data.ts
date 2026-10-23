// Données structurées schema.org d'une annonce (JSON-LD), lues par Google pour afficher
// le prix et la disponibilité dans ses résultats. Fonction pure.

import { CONDITIONS, FORMATS, normalizeFormat, type PublicListing } from "./listings.ts";

/** Fiche « produit » d'un deck en vente. `url` : adresse absolue de la page. */
export function deckProductJsonLd(l: PublicListing, url: string): Record<string, unknown> {
  const format = FORMATS[normalizeFormat(l.format)];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: l.title,
    description: `Deck ${format}${l.archetype ? ` ${l.archetype.name}` : ""} complet, ${l.card_count} cartes, état ${CONDITIONS[l.condition].toLowerCase()}.`,
    category: `Magic: The Gathering › Deck ${format}`,
    ...(l.cover_image_url ? { image: l.cover_image_url } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "EUR",
      price: (l.asking_cents / 100).toFixed(2),
      // Réservé : quelqu'un est déjà en discussion pour l'acheter.
      availability: l.status === "active" ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability",
      itemCondition: "https://schema.org/UsedCondition",
      ...(l.seller ? { seller: { "@type": "Person", name: l.seller.display_name } } : {}),
    },
  };
}

/** Texte à placer dans <script type="application/ld+json"> : « < » échappé, pour ne jamais fermer la balise. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
