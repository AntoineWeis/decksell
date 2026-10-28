import { BRACKETS, bracketReasons, type BracketFacts, type BracketLevel } from "@/lib/bracket";

/** Les cinq niveaux, du plus détendu au plus compétitif : le niveau du deck est mis en avant. */
function Scale({ level, min }: { level: BracketLevel; min: BracketLevel }) {
  return (
    <ol className="mt-3 grid grid-cols-5 gap-1" aria-hidden>
      {([1, 2, 3, 4, 5] as BracketLevel[]).map((b) => (
        <li
          key={b}
          className={`flex h-8 items-center justify-center rounded-md text-sm font-semibold tabular-nums ${
            b === level
              ? "bg-commander-solid text-white"
              : b < min && !(b === 1 && min === 2)
                ? "bg-sunken text-muted/50"
                : "bg-commander-soft text-commander"
          }`}
        >
          {b}
        </li>
      ))}
    </ol>
  );
}

/**
 * Encadré « Niveau de puissance » d'un deck Commander : niveau annoncé (ou minimum déduit de la
 * liste) sur l'échelle officielle de 1 à 5, et ce qui le fixe (Game Changers, combos…).
 */
export function BracketCard({
  facts,
  min,
  declared,
}: {
  facts: BracketFacts;
  min: BracketLevel;
  /** Niveau annoncé par le vendeur ; absent dans l'estimateur (on montre le minimum). */
  declared?: BracketLevel | null;
}) {
  const level = declared ?? min;
  const info = BRACKETS[level];
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold">Niveau de puissance</h2>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="leading-none">
          <span className="display text-4xl tabular-nums">{level}</span>
          <span className="text-sm text-muted"> / 5</span>
        </p>
        <p className="text-right">
          <span className="block text-sm font-semibold text-commander">{info.name}</span>
          <span className="block text-xs text-muted">{info.summary}</span>
        </p>
      </div>
      <Scale level={level} min={min} />
      {declared == null ? (
        // Estimateur : le niveau est déduit de la liste seule ; le vendeur garde la main.
        <p className="mt-3 rounded-lg bg-commander-soft px-3 py-2 text-xs leading-relaxed text-commander">
          Niveau indicatif : niveau {min} au minimum d&apos;après les règles officielles des brackets, appliquées à la
          liste. Ces règles tiennent aussi compte de l&apos;intention du deck : tu pourras choisir ton niveau à la mise
          en vente, puis le modifier à tout moment depuis ton annonce.
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted">
          {declared === min
            ? "Niveau annoncé par le vendeur, conforme à la liste."
            : `Niveau annoncé par le vendeur. D'après la liste : niveau ${min} au minimum.`}
        </p>
      )}
      <ul className="mt-3 space-y-1.5 text-sm">
        {bracketReasons(facts).map((r) => (
          <li key={r} className="leading-snug">
            {r}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-muted">
        Échelle officielle des « brackets » Commander (bêta). Combos repérés par{" "}
        <a href="https://commanderspellbook.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          Commander Spellbook
        </a>
        .
      </p>
    </div>
  );
}

/** Pastille du niveau de puissance (« Niveau 3 · Upgraded »), pour les cartes de deck. */
export function BracketBadge({ level }: { level: number | null | undefined }) {
  if (level == null || level < 1 || level > 5) return null;
  const info = BRACKETS[level as BracketLevel];
  return (
    <span
      className="rounded-md bg-commander-soft px-1.5 py-0.5 text-xs font-semibold tabular-nums text-commander"
      title={`Niveau de puissance Commander : ${info.summary.toLowerCase()}`}
    >
      Niveau {level} · {info.name}
    </span>
  );
}
