import type { Metadata } from "next";
import { CATALOGS, DeckCatalog } from "@/components/deck-catalog";

export const metadata: Metadata = {
  title: CATALOGS.modern.metaTitle,
  description: CATALOGS.modern.metaDescription,
  // Les filtres et le tri ne créent pas de nouvelles pages pour Google : tout pointe vers la liste.
  alternates: { canonical: "/modern" },
};

/** Catalogue des decks Modern : MetaScore, archétypes Modern. */
export default function ModernPage({ searchParams }: PageProps<"/modern">) {
  return <DeckCatalog format="modern" searchParams={searchParams} />;
}
