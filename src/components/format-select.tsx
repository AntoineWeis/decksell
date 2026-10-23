import { DEFAULT_FORMAT, FORMATS, type DeckFormat } from "@/lib/listings";

/** Liste déroulante du format de jeu (champ « format »). D'autres formats s'ajouteront à FORMATS. */
export function FormatSelect({ defaultFormat = DEFAULT_FORMAT, className }: { defaultFormat?: DeckFormat; className: string }) {
  const formats = Object.entries(FORMATS) as [DeckFormat, string][];
  return (
    <>
      <select name="format" defaultValue={defaultFormat} className={className}>
        {formats.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {formats.length === 1 && <span className="mt-1 block text-xs text-muted">D&apos;autres formats arriveront bientôt.</span>}
    </>
  );
}
