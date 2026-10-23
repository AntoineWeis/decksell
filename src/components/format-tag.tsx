import { FORMATS, normalizeFormat } from "@/lib/listings";

/** Format de jeu du deck (« Modern »), affiché à côté de son nom. */
export function FormatTag({ format, onDark = false, className = "" }: { format: unknown; onDark?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 align-middle text-[11px] font-bold uppercase leading-none tracking-wide ${
        onDark ? "bg-white/15 text-banner-ink ring-1 ring-white/20" : "bg-banner text-banner-ink"
      } ${className}`}
    >
      {FORMATS[normalizeFormat(format)]}
    </span>
  );
}
