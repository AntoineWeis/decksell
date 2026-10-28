import Link from "next/link";
import { normalizeFormat, type Archetype, type ManaColor } from "@/lib/listings";
import { ManaColors } from "./mana";
import { EMPTY_QUERY, decksHref } from "@/lib/deck-index";

/** Couleurs et archétype d'un deck ; l'archétype mène au catalogue de son format, filtré. */
export function DeckTags({
  colors,
  archetype,
  format,
  onDark = false,
}: {
  colors: ManaColor[];
  archetype: Archetype | null;
  format?: unknown;
  onDark?: boolean;
}) {
  return (
    <p className="flex flex-wrap items-center gap-3">
      <ManaColors colors={colors} size={22} />
      {archetype && (
        <Link
          href={decksHref({ ...EMPTY_QUERY, format: format == null ? null : normalizeFormat(format), archetype: archetype.slug })}
          className={
            onDark
              ? "rounded-md bg-white/10 px-2 py-0.5 text-sm font-semibold text-banner-ink ring-1 ring-white/15 hover:bg-white/20"
              : "rounded-md bg-brand-soft px-2 py-0.5 text-sm font-semibold text-link hover:underline"
          }
        >
          {archetype.name}
        </Link>
      )}
    </p>
  );
}
