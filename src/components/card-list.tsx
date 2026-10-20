import Image from "next/image";
import { formatEur, type PricedLine } from "@/lib/pricing";

/** Prix les plus élevés en premier, cartes sans prix à la fin. */
function byValue(a: PricedLine, b: PricedLine) {
  if (a.lineCents == null) return b.lineCents == null ? 0 : 1;
  if (b.lineCents == null) return -1;
  return b.lineCents - a.lineCents;
}

export function CardList({ title, lines, totalCents }: { title: string; lines: PricedLine[]; totalCents: number }) {
  if (lines.length === 0) return null;
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  return (
    <section className="rounded-2xl border border-line bg-surface">
      <header className="flex items-baseline justify-between border-b border-line px-4 py-3 sm:px-5">
        <h2 className="font-semibold">
          {title} <span className="ml-1 text-sm font-normal text-muted">{count} cartes</span>
        </h2>
        <span className="font-semibold tabular-nums">{formatEur(totalCents)}</span>
      </header>
      <ul className="divide-y divide-line">
        {[...lines].sort(byValue).map((l) => (
          <CardRow key={`${l.board}-${l.name}`} line={l} />
        ))}
      </ul>
    </section>
  );
}

function CardRow({ line }: { line: PricedLine }) {
  const { card } = line;
  const missing = line.unitCents == null;
  return (
    <li className="group relative flex items-center gap-3 px-4 py-2.5 sm:px-5">
      <span className="w-6 shrink-0 text-right text-sm font-medium tabular-nums text-muted">{line.quantity}</span>

      <div className="relative h-[42px] w-[30px] shrink-0 overflow-hidden rounded-[3px] bg-sunken">
        {card?.imageUrl && (
          <Image src={card.imageUrl} alt="" fill sizes="30px" unoptimized className="object-cover" />
        )}
      </div>

      {/* Aperçu agrandi au survol (écrans larges) */}
      {card?.imageUrl && (
        <div className="pointer-events-none absolute left-24 top-1/2 z-20 w-[244px] lg:left-auto lg:right-full lg:mr-4 hidden -translate-y-1/2 opacity-0 transition-opacity duration-150 sm:block group-hover:opacity-100">
          <Image
            src={card.imageUrl}
            alt={card.name}
            width={244}
            height={340}
            unoptimized
            className="rounded-[12px] shadow-2xl"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{line.name}</p>
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
          <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-medium text-warn">
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
