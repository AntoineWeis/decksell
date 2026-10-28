import { FORMATS, normalizeFormat } from "@/lib/listings";

// Une couleur par format : le bleu de la marque pour Modern, son violet pour Commander.
const TONE = {
  modern: { light: "bg-brand-soft text-link", dark: "bg-[#3b7bff]/25 text-[#d6e4ff] ring-[#7fa8ff]/40" },
  commander: { light: "bg-commander-soft text-commander", dark: "bg-[#8b6cff]/25 text-[#e6ddff] ring-[#b39bff]/40" },
} as const;

/** Format de jeu du deck (« Modern », « Commander »), affiché à côté de son nom. */
export function FormatTag({ format, onDark = false, className = "" }: { format: unknown; onDark?: boolean; className?: string }) {
  const f = normalizeFormat(format);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 align-middle text-[11px] font-bold uppercase leading-none tracking-wide ${
        onDark ? `ring-1 ${TONE[f].dark}` : TONE[f].light
      } ${className}`}
    >
      {FORMATS[f]}
    </span>
  );
}
