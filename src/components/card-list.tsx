import Image from "next/image";
import { formatEur, type PricedLine } from "@/lib/pricing";
import { CONDITIONS, smallImage } from "@/lib/listings";
import { CONDITION_SHORT, CONDITION_TONE, LANGUAGES, detailKey, type CardDetail } from "@/lib/card-details";
import { TYPE_GROUPS, typeGroup } from "@/lib/deck-stats";
import { groupAnchor } from "./card-types";
import { CardModal, type CardModalItem } from "./card-modal";

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
  details,
  groupByType = false,
  id,
}: {
  title: string;
  lines: PricedLine[];
  totalCents: number;
  /** État et langue déclarés par le vendeur, par ligne (annonces seulement). */
  details?: Map<string, CardDetail>;
  /** Côté où s'ouvre l'aperçu agrandi sur grand écran (là où il y a de la place). */
  previewSide?: "left" | "right";
  /** Regroupe les cartes par type, façon Moxfield (créatures, éphémères, terrains…), triées par valeur dans chaque groupe. */
  groupByType?: boolean;
  /** Ancre de la section (ex. « type-side » pour la réserve). */
  id?: string;
}) {
  if (lines.length === 0) return null;
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const sorted = [...lines].sort(byValue);
  const groups = groupByType
    ? TYPE_GROUPS.map((g) => ({ ...g, lines: sorted.filter((l) => typeGroup(l.card?.typeLine) === g.key) })).filter((g) => g.lines.length > 0)
    : [{ key: "all", label: null, lines: sorted }];
  // Ordre d'apparition des lignes : de la moins chère à la plus chère, sur toute la liste.
  const rank = new Map(sorted.map((l, i) => [l, sorted.length - 1 - i]));
  // Cartes de la fenêtre « carte en grand », dans l'ordre d'affichage (flèches ← →).
  const shown = groups.flatMap((g) => g.lines).filter((l) => l.card);
  const modalIndex = new Map(shown.map((l, i) => [l, i]));
  const items: CardModalItem[] = shown.map((l) => {
    const d = details?.get(detailKey(l.board, l.name));
    return {
      name: l.card!.name,
      quantity: l.quantity,
      imageUrl: l.card!.imageUrl,
      typeLine: l.card!.typeLine ?? null,
      setCode: l.card!.setCode,
      collectorNumber: l.card!.collectorNumber,
      artist: l.card!.artist,
      rarity: l.card!.rarity ? (RARITY_LABEL[l.card!.rarity] ?? l.card!.rarity) : null,
      unitCents: l.unitCents,
      lineCents: l.lineCents,
      manual: l.status === "manual",
      condition: d ? CONDITIONS[d.condition] : null,
      lang: d ? LANGUAGES[d.lang].label : null,
    };
  });
  const row = (l: PricedLine) => (
    <CardRow
      key={`${l.board}-${l.name}`}
      line={l}
      delayMs={Math.min(rank.get(l)! * 20, 500)}
      previewSide={previewSide}
      detail={details?.get(detailKey(l.board, l.name))}
      modalIndex={modalIndex.get(l)}
    />
  );
  return (
    <section id={id} className="scroll-mt-20 rounded-xl border border-line bg-surface">
      {/* Clic sur une carte : fenêtre avec la carte en grand. */}
      <CardModal items={items} />
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
      {groups.map((g) =>
        g.label ? (
          <div key={g.key} id={groupAnchor(g.key)} className="scroll-mt-20 border-b border-line last:border-b-0">
            <h3 className="flex items-baseline justify-between gap-4 border-b border-line px-4 pb-1.5 pt-3 text-sm font-semibold sm:px-5">
              <span>
                {g.label} <span className="ml-0.5 font-normal tabular-nums text-muted">{g.lines.reduce((n, l) => n + l.quantity, 0)}</span>
              </span>
              <span className="font-normal tabular-nums text-muted">{formatEur(g.lines.reduce((n, l) => n + (l.lineCents ?? 0), 0))}</span>
            </h3>
            <ul className="divide-y divide-line">{g.lines.map(row)}</ul>
          </div>
        ) : (
          <ul key={g.key} className="divide-y divide-line">
            {g.lines.map(row)}
          </ul>
        ),
      )}
    </section>
  );
}

function CardRow({
  line,
  delayMs,
  previewSide,
  detail,
  modalIndex,
}: {
  line: PricedLine;
  delayMs: number;
  previewSide: "left" | "right";
  detail?: CardDetail;
  /** Position dans la fenêtre « carte en grand » ; absente pour une carte introuvable. */
  modalIndex?: number;
}) {
  const { card } = line;
  const missing = line.unitCents == null;
  const rarity = card?.rarity ?? null;
  return (
    <li
      className={`slide-out group relative flex items-center gap-3 px-4 py-2 transition-colors hover:z-20 hover:bg-sunken sm:px-5 ${missing ? "hatch" : ""} ${modalIndex != null ? "cursor-pointer" : ""}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span className="w-6 shrink-0 text-right text-sm font-medium tabular-nums text-muted">{line.quantity}</span>

      <div className="relative h-[42px] w-[30px] shrink-0 overflow-hidden rounded-[3px] bg-sunken">
        {/* Miniature : petite image Scryfall ; la grande ne sert qu'à l'aperçu au survol. */}
        {card?.imageUrl && <Image src={smallImage(card.imageUrl)!} alt="" fill sizes="30px" unoptimized className="object-cover" />}
      </div>

      {/* Aperçu agrandi au survol (écrans larges), ouvert du côté où il y a de la place.
          Image de fond : le navigateur ne la télécharge qu'au survol (une <img> masquée se charge quand même). */}
      {card?.imageUrl && (
        <div
          aria-hidden
          style={{ "--preview": `url("${card.imageUrl}")` } as React.CSSProperties}
          className={`pointer-events-none absolute top-1/2 z-20 hidden aspect-[244/340] w-[244px] -translate-y-1/2 rounded-[12px] bg-cover shadow-2xl sm:left-1/2 sm:group-hover:block sm:group-hover:[background-image:var(--preview)] ${
            previewSide === "left" ? "lg:left-auto lg:right-full lg:mr-4" : "lg:left-full lg:ml-4"
          }`}
        />
      )}

      <div className="min-w-0 flex-1">
        {/* Le nom passe à la ligne plutôt que d'être coupé ; les badges suivent dessous s'il le faut. */}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium leading-snug">
          {/* Le losange de rareté reste collé au début du nom, même quand celui-ci passe à la ligne. */}
          <span className="min-w-0 break-words">
            {rarity && (
              <span className={`gem gem-${rarity} mr-2 align-[1px]`} title={RARITY_LABEL[rarity] ?? rarity}>
                <span className="sr-only">{RARITY_LABEL[rarity] ?? rarity}</span>
              </span>
            )}
            {modalIndex != null ? (
              // Bouton étiré sur toute la ligne (after:inset-0) : un clic n'importe où ouvre la carte.
              <button
                type="button"
                data-card-index={modalIndex}
                className="text-left after:absolute after:inset-0 after:content-[''] hover:text-link focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-link"
              >
                {line.name}
              </button>
            ) : (
              line.name
            )}
          </span>
          {detail && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold tabular-nums">
              <span className="rounded bg-sunken px-1.5 py-0.5 text-muted" title={LANGUAGES[detail.lang].label}>
                {LANGUAGES[detail.lang].short}
                <span className="sr-only"> ({LANGUAGES[detail.lang].label})</span>
              </span>
              <span className={`rounded px-1.5 py-0.5 ring-1 ring-inset ${CONDITION_TONE[detail.condition]}`} title={CONDITIONS[detail.condition]}>
                {CONDITION_SHORT[detail.condition]}
                <span className="sr-only"> ({CONDITIONS[detail.condition]})</span>
              </span>
            </span>
          )}
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
