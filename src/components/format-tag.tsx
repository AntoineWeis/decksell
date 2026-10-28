import { FORMATS, normalizeFormat } from "@/lib/listings";

// Une couleur pleine par format, lisible d'un coup d'œil : bleu pour Modern, magenta pour Commander.
const TONE = {
  modern: "bg-modern-solid",
  commander: "bg-commander-solid",
} as const;

/** Format de jeu du deck (« Modern », « Commander »), affiché à côté de son nom. */
export function FormatTag({ format, onDark = false, className = "" }: { format: unknown; onDark?: boolean; className?: string }) {
  const f = normalizeFormat(format);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 align-middle text-[11px] font-bold uppercase leading-none tracking-wide text-white ${TONE[f]} ${
        onDark ? "ring-1 ring-white/25" : ""
      } ${className}`}
    >
      {FORMATS[f]}
    </span>
  );
}
