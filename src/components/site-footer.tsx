import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <nav className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium" aria-label="Pied de page">
          <Link href="/qui-sommes-nous" className="text-muted hover:text-foreground">
            Qui sommes-nous
          </Link>
          <Link href="/conditions-utilisation" className="text-muted hover:text-foreground">
            Conditions d&apos;utilisation
          </Link>
          <Link href="/confidentialite" className="text-muted hover:text-foreground">
            Confidentialité
          </Link>
        </nav>
        <div className="space-y-1 text-xs text-muted">
          <p>
            Données de cartes et images :{" "}
            <a href="https://scryfall.com" className="underline underline-offset-2 hover:text-foreground">
              Scryfall
            </a>
            . Prix en euros issus de Cardmarket, indicatifs et datés.
          </p>
          <p>
            Ce site est un contenu de fans non officiel, non approuvé par Wizards of the Coast. Portions des éléments
            utilisés : propriété de Wizards of the Coast. ©Wizards of the Coast LLC.
          </p>
        </div>
      </div>
    </footer>
  );
}
