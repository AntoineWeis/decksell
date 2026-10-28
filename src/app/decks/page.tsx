import type { Metadata } from "next";
import { CATALOGS, DeckCatalog } from "@/components/deck-catalog";

export const metadata: Metadata = {
  title: CATALOGS.all.metaTitle,
  description: CATALOGS.all.metaDescription,
  // Les filtres et le tri ne créent pas de nouvelles pages pour Google : tout pointe vers la liste.
  alternates: { canonical: "/decks" },
};

/** Tous les decks en vente, Modern et Commander. */
export default function DecksPage({ searchParams }: PageProps<"/decks">) {
  return <DeckCatalog format={null} searchParams={searchParams} />;
}
