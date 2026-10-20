import { Estimator } from "@/components/estimator";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <header className="mb-8 sm:mb-10">
          <p className="text-sm font-semibold tracking-wide text-accent">decksell</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Combien vaut ton deck Modern ?</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Colle ta decklist et obtiens sa valeur carte par carte, d&apos;après les prix Cardmarket.
          </p>
        </header>
        <Estimator />
      </main>

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
    </div>
  );
}
