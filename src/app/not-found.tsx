import type { Metadata } from "next";
import { PrimaryLink, SecondaryLink, StatusPage } from "@/components/status-page";

export const metadata: Metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <StatusPage
      code="Erreur 404"
      title="Cette page est introuvable"
      actions={
        <>
          <PrimaryLink href="/decks">Voir les decks en vente</PrimaryLink>
          <SecondaryLink href="/estimer">Estimer un deck</SecondaryLink>
        </>
      }
    >
      <p>Le lien est peut-être incomplet, ou le deck a été vendu ou retiré de la vente entre-temps.</p>
    </StatusPage>
  );
}
