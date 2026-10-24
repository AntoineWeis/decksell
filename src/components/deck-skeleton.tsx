import { LoadingFlask } from "./loading-flask";

// Squelettes de chargement d'un deck : ils reprennent la forme de la vraie page (bandeau, liste
// groupée par type, encadré prix). Les lignes arrivent en cascade, un reflet violet les balaie.
// Rien ne s'affiche avant 250 ms (classe load-delay) : un chargement rapide ne clignote pas.

const delay = (ms: number) => ({ "--skel-delay": `${ms}ms` }) as React.CSSProperties;

function Bar({ className = "", ms = 0, dark = false }: { className?: string; ms?: number; dark?: boolean }) {
  return <span className={`skel block ${dark ? "skel-dark" : ""} ${className}`} style={delay(ms)} />;
}

/** Une ligne de carte : quantité, vignette, nom, prix. */
function CardRowSkeleton({ ms, width }: { ms: number; width: string }) {
  return (
    <li className="skel-row flex items-center gap-3 py-2" style={delay(ms)}>
      <Bar className="h-3.5 w-3.5" ms={ms} />
      <Bar className="h-9 w-7 rounded-[3px]" ms={ms} />
      <Bar className={`h-3.5 ${width}`} ms={ms} />
      <span className="flex-1" />
      <Bar className="h-3.5 w-14" ms={ms} />
    </li>
  );
}

// Groupes de cartes (largeur du titre, largeurs des noms) ; chaque ligne garde son rang pour la cascade.
const GROUPS = (() => {
  let rank = 0;
  return [
    { title: "w-24", rows: ["w-40", "w-32", "w-44"] },
    { title: "w-20", rows: ["w-36", "w-28", "w-48", "w-32"] },
    { title: "w-24", rows: ["w-44", "w-36"] },
  ].map((g) => ({ title: g.title, start: rank, rows: g.rows.map((width) => ({ width, rank: ++rank })) }));
})();

/** Liste de cartes groupée par type. */
export function DeckListSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-3">
      {GROUPS.map((g, gi) => (
        <div key={gi} className={gi ? "mt-3" : ""}>
          <Bar className={`mb-1 mt-2 h-3.5 ${g.title}`} ms={g.start * 90} />
          <ul>
            {g.rows.map((r) => (
              <CardRowSkeleton key={r.rank} ms={r.rank * 90} width={r.width} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Encadré prix : prix, jauge, détails, bouton. */
export function PriceBoxSkeleton() {
  return (
    <div className="space-y-2.5 rounded-xl border border-line bg-surface p-5">
      <Bar className="h-3 w-20" />
      <Bar className="h-8 w-36" ms={60} />
      <Bar className="!mt-4 h-1.5 rounded-full" ms={120} />
      <Bar className="!mt-4 h-3" ms={180} />
      <Bar className="h-3 w-4/5" ms={240} />
      <Bar className="h-3 w-3/5" ms={300} />
      <Bar className="!mt-5 h-11 rounded-xl" ms={360} />
    </div>
  );
}

/** En-tête d'attente : la fiole qui se remplit et une phrase. */
export function LoadingHeader({ label, onDark = false }: { label: string; onDark?: boolean }) {
  return (
    <div className="flex items-center gap-3" role="status">
      <LoadingFlask size={40} />
      <p className={`text-sm ${onDark ? "text-banner-muted" : "text-muted"}`}>{label}</p>
    </div>
  );
}

/** Page d'un deck pendant son chargement. */
export function DeckPageSkeleton() {
  return (
    <div aria-busy className="load-delay">
      <div className="bg-banner">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6">
          <Bar dark className="h-3.5 w-40" />
          <Bar dark className="mt-6 h-9 w-2/3 max-w-md" ms={60} />
          <div className="mt-4 flex gap-2">
            <Bar dark className="h-6 w-16 rounded-full" ms={120} />
            <Bar dark className="h-6 w-20 rounded-full" ms={160} />
          </div>
          <div className="mt-6">
            <LoadingHeader label="Mélange des cartes…" onDark />
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 pt-6 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-start">
        <div className="order-2 min-w-0 lg:order-none">
          <DeckListSkeleton />
        </div>
        <div className="order-1 lg:order-none">
          <PriceBoxSkeleton />
        </div>
      </div>
    </div>
  );
}

/** Résultat d'une estimation en attente (page Estimer). */
export function EstimateSkeleton() {
  return (
    <div aria-busy className="load-delay space-y-6">
      <div className="rounded-xl border border-line bg-surface p-5">
        <LoadingHeader label="Recherche des prix sur Cardmarket…" />
        <div className="mt-4 space-y-2.5">
          <Bar className="h-8 w-40" ms={60} />
          <Bar className="h-3 w-3/5" ms={120} />
        </div>
      </div>
      <DeckListSkeleton />
    </div>
  );
}
