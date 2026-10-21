// Éléments communs aux pages juridiques (conditions d'utilisation, confidentialité).

/** Information que l'éditeur doit encore fournir : signalée, jamais inventée. */
export function ToComplete({ children }: { children: React.ReactNode }) {
  return (
    <span className="hatch rounded border border-warn/40 px-1.5 py-0.5 text-sm font-medium text-warn">
      À compléter : {children}
    </span>
  );
}

export type LegalSectionRef = { id: string; title: string };

/** Bandeau, sommaire et colonne de texte d'une page juridique. */
export function LegalPage({
  title,
  intro,
  updated,
  sections,
  children,
}: {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSectionRef[];
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1">
      <section className="bg-banner text-banner-ink">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
          <h1 className="display text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-banner-muted">{intro}</p>
          <p className="mt-4 text-sm text-banner-muted">Dernière mise à jour : {updated}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
        <nav aria-label="Sommaire" className="lg:sticky lg:top-20 lg:self-start">
          <p className="text-sm font-semibold">Sommaire</p>
          <ol className="mt-3 space-y-1.5 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex gap-2 text-muted hover:text-foreground">
                  <span className="w-5 shrink-0 tabular-nums">{i + 1}.</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="max-w-[72ch] space-y-10 leading-relaxed [&_h2]:scroll-mt-20 [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </article>
      </div>
    </main>
  );
}

export function LegalSection({
  n,
  id,
  title,
  children,
}: {
  n: number;
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="display text-2xl">
        <span className="mr-2 tabular-nums text-muted">{n}.</span>
        {title}
      </h2>
      <div className="text-foreground/90">{children}</div>
    </section>
  );
}
