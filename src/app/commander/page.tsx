import type { Metadata } from "next";
import { CATALOGS, DeckCatalog } from "@/components/deck-catalog";

export const metadata: Metadata = {
  title: CATALOGS.commander.metaTitle,
  description: CATALOGS.commander.metaDescription,
  // Les filtres et le tri ne créent pas de nouvelles pages pour Google : tout pointe vers la liste.
  alternates: { canonical: "/commander" },
};

/** Catalogue des decks Commander : niveau de puissance, archétypes Commander. */
export default function CommanderPage({ searchParams }: PageProps<"/commander">) {
  return <DeckCatalog format="commander" searchParams={searchParams} />;
}
