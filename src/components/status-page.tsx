import Link from "next/link";

/** Illustration originale : deux cartes retournées, l'une de travers. */
function LostCardsArt() {
  return (
    <svg viewBox="0 0 160 120" className="mx-auto h-28 w-auto" aria-hidden>
      <g transform="rotate(-12 60 62)">
        <rect x="34" y="20" width="56" height="78" rx="6" fill="var(--sunken)" stroke="var(--line)" strokeWidth="1.5" />
        <rect x="41" y="27" width="42" height="64" rx="3.5" fill="none" stroke="var(--line)" strokeWidth="1.5" />
      </g>
      <g transform="rotate(9 100 58)">
        <rect x="72" y="16" width="56" height="78" rx="6" fill="var(--banner)" stroke="var(--accent)" strokeOpacity="0.5" strokeWidth="1.5" />
        <rect x="79" y="23" width="42" height="64" rx="3.5" fill="none" stroke="var(--accent)" strokeOpacity="0.35" strokeWidth="1.5" />
        <text x="100" y="62" textAnchor="middle" fill="var(--banner-ink)" fontSize="22" fontWeight="700" fontFamily="var(--font-sora)">
          ?
        </text>
      </g>
    </svg>
  );
}

const primary =
  "inline-flex h-11 items-center rounded-lg bg-accent px-5 font-semibold text-on-accent transition hover:bg-accent-hover";
const secondary =
  "inline-flex h-11 items-center rounded-lg border border-line px-5 font-semibold transition hover:border-link/50 hover:text-link";

/** Page d'état (404, erreur) aux couleurs du site. */
export function StatusPage({
  code,
  title,
  children,
  actions,
}: {
  code: string;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-lg text-center">
        <LostCardsArt />
        <p className="mt-6 font-mono text-sm font-medium text-muted">{code}</p>
        <h1 className="display mt-1 text-3xl sm:text-4xl">{title}</h1>
        <div className="mx-auto mt-3 max-w-md leading-relaxed text-muted">{children}</div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
      </div>
    </main>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={primary}>
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={secondary}>
      {children}
    </Link>
  );
}

export const statusButtonClass = { primary, secondary };
