export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl space-y-1 px-4 py-6 text-xs text-muted sm:px-6">
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
    </footer>
  );
}
