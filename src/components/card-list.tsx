import Image from "next/image";
import { formatEur, type PricedLine } from "@/lib/pricing";

const RARITY_LABEL: Record<string, string> = {
  common: "Commune",
  uncommon: "Peu commune",
  rare: "Rare",
  mythic: "Mythique",
  special: "Spéciale",
  bonus: "Bonus",
};

/** Prix les plus élevés en premier, cartes sans prix à la fin. */
function byValue(a: PricedLine, b: PricedLine) {
  if (a.lineCents == null) return b.lineCents == null ? 0 : 1;
  if (b.lineCents == null) return -1;
  return b.lineCents - a.lineCents;
}

/** Tableau de cartes façon page de deck : quantité, carte, prix, trié par valeur. */
export function CardList({
  title,
  lines,
  totalCents,
  previewSide = "left",
}: {
  title: string;
  lines: PricedLine[];
  totalCents: number;
  /** Côté où s'ouvre l'aperçu agrandi sur grand écran (là où il y a de la place). */
  previewSide?: "left" | "right";
}) {
  if (lines.length === 0) return null;
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const sorted = [...lines].sort(byValue);
  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="flex items-baseline justify-between gap-4 px-4 pb-3 pt-4 sm:px-5">
        <h2 className="text-lg font-semibold">
          {title} <span className="ml-1 text-sm font-normal text-muted">{count} cartes</span>
        </h2>
        <span className="font-semibold tabular-nums">{formatEur(totalCents)}</span>
      </header>
      <div className="flex items-center gap-3 border-y border-line bg-sunken px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted sm:px-5">
        <span className="w-6 text-right">Qté</span>
        <span className="w-[30px]" aria-hidden />
        <span className="flex-1">Carte</span>
        <span>Prix</span>
      </div>
      <ul className="divide-y divide-line">
        {sorted.map((l, i) => (
          // Les lignes apparaissent de la moins chère à la plus chère.
          <CardRow
            key={`${l.board}-${l.name}`}
            line={l}
            delayMs={Math.min((sorted.length - 1 - i) * 20, 500)}
            previewSide={previewSide}
          />
        ))}
      </ul>
    </section>
  );
}

function CardRow({ line, delayMs, previewSide }: { line: PricedLine; delayMs: number; previewSide: "left" | "right" }) {
  const { card } = line;
  const missing = line.unitCents == null;
  const rarity = card?.rarity ?? null;
  return (
    <li
      className={`slide-out group relative flex items-center gap-3 px-4 py-2 transition-colors hover:z-20 hover:bg-sunken sm:px-5 ${missing ? "hatch" : ""}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span className="w-6 shrink-0 text-right text-sm font-medium tabular-nums text-muted">{line.quantity}</span>

      <div className="relative h-[42px] w-[30px] shrink-0 overflow-hidden rounded-[3px] bg-sunken">
        {card?.imageUrl && <Image src={card.imageUrl} alt="" fill sizes="30px" unoptimized className="object-cover" />}
      </div>

      {/* Aperçu agrandi au survol (écrans larges), ouvert du côté où il y a de la place. */}
      {card?.imageUrl && (
        <div className={`pointer-events-none absolute top-1/2 z-20 hidden w-[244px] -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 sm:left-1/2 sm:block ${
            previewSide === "left" ? "lg:left-auto lg:right-full lg:mr-4" : "lg:left-full lg:ml-4"
          }`}>
          <Image src={card.imageUrl} alt={card.name} width={244} height={340} unoptimized className="rounded-[12px] shadow-2xl" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium">
          {rarity && (
            <span className={`gem gem-${rarity}`} title={RARITY_LABEL[rarity] ?? rarity}>
              <span className="sr-only">{RARITY_LABEL[rarity] ?? rarity}</span>
            </span>
          )}
          <span className="truncate">{line.name}</span>
        </p>
        <p className="truncate text-xs text-muted">
          {card ? (
            <>
              {card.setCode.toUpperCase()} · {card.collectorNumber}
              {card.artist && <span className="hidden sm:inline"> · Ill. {card.artist}</span>}
            </>
          ) : (
            "Carte introuvable"
          )}
        </p>
      </div>

      <div className="shrink-0 text-right">
        {missing ? (
          <span className="text-xs font-semibold text-warn">
            {line.status === "not_found" ? "Introuvable" : "Sans prix"}
          </span>
        ) : (
          <>
            <p className="font-medium tabular-nums">{formatEur(line.lineCents!)}</p>
            <p className="text-xs tabular-nums text-muted">
              {line.quantity > 1 && `${line.quantity} × ${formatEur(line.unitCents!)}`}
              {line.status === "manual" && (line.quantity > 1 ? " · saisi" : "prix saisi")}
            </p>
          </>
        )}
      </div>
    </li>
  );
}
