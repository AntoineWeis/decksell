import { DEFAULT_FORMAT, FORMATS, type DeckFormat } from "@/lib/listings";

/**
 * Liste déroulante du format de jeu (champ « format »). Libre (defaultFormat), ou pilotée
 * (value et onChange) quand le reste du formulaire dépend du format.
 */
export function FormatSelect({
  defaultFormat = DEFAULT_FORMAT,
  value,
  onChange,
  className,
}: {
  defaultFormat?: DeckFormat;
  value?: DeckFormat;
  onChange?: (format: DeckFormat) => void;
  className: string;
}) {
  const formats = Object.entries(FORMATS) as [DeckFormat, string][];
  const controlled = value !== undefined ? { value, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value as DeckFormat) } : { defaultValue: defaultFormat };
  return (
    <select name="format" {...controlled} className={className}>
      {formats.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}
