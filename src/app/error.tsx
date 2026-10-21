"use client";

import { useEffect } from "react";
import { SecondaryLink, StatusPage, statusButtonClass } from "@/components/status-page";

// Erreur inattendue dans une page : le menu et le pied de page restent affichés.
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <StatusPage
      code="Erreur"
      title="Un problème est survenu"
      actions={
        <>
          <button type="button" onClick={() => retry()} className={statusButtonClass.primary}>
            Réessayer
          </button>
          <SecondaryLink href="/">Retour à l&apos;accueil</SecondaryLink>
        </>
      }
    >
      <p>Cette page n&apos;a pas pu se charger. C&apos;est souvent passager : réessaie dans un instant.</p>
      {digest && <p className="mt-3 font-mono text-xs">Référence : {digest}</p>}
    </StatusPage>
  );
}
