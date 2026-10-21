"use client";

import { useEffect } from "react";
import "./globals.css";
import { SecondaryLink, StatusPage, statusButtonClass } from "@/components/status-page";

// Erreur dans la mise en page elle-même : remplace tout le document, sans menu ni pied de page.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <title>Erreur · decksell</title>
        <StatusPage
          code="Erreur"
          title="decksell est momentanément indisponible"
          actions={
            <>
              <button type="button" onClick={() => retry()} className={statusButtonClass.primary}>
                Réessayer
              </button>
              <SecondaryLink href="/">Retour à l&apos;accueil</SecondaryLink>
            </>
          }
        >
          <p>Le site n&apos;a pas pu se charger. Réessaie dans un instant.</p>
        </StatusPage>
      </body>
    </html>
  );
}
