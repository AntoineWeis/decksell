import { MANA_COLORS, type Archetype, type ManaColor } from "@/lib/listings";
import { ManaSymbol } from "./mana";

/** Cases à cocher des couleurs du deck, en symboles de mana (champ « colors », plusieurs valeurs). */
export function ColorPicker({
  defaultColors = [],
  compact = false,
  required = false,
}: {
  defaultColors?: ManaColor[];
  compact?: boolean;
  required?: boolean;
}) {
  return (
    <fieldset>
      <legend className={compact ? "mb-1 text-xs text-muted" : "mb-1 text-sm font-medium"}>
        Couleurs du deck{required && <span className="text-danger"> *</span>}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(MANA_COLORS) as ManaColor[]).map((c) => (
          <label key={c} className="cursor-pointer">
            <input
              type="checkbox"
              name="colors"
              value={c}
              aria-label={MANA_COLORS[c]}
              defaultChecked={defaultColors.includes(c)}
              className="peer sr-only"
            />
            <span
              title={MANA_COLORS[c]}
              className={`flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-muted transition hover:border-link/50 [&_img]:opacity-45 [&_img]:grayscale peer-checked:border-link peer-checked:bg-brand-soft peer-checked:font-semibold peer-checked:text-link peer-checked:[&_img]:opacity-100 peer-checked:[&_img]:grayscale-0 peer-focus-visible:outline-2 peer-focus-visible:outline-link ${
                compact ? "h-[34px] text-xs" : "h-10 text-sm"
              }`}
            >
              <ManaSymbol color={c} size={20} />
              {!compact && <span>{MANA_COLORS[c]}</span>}
            </span>
          </label>
        ))}
      </div>
      {!compact && <p className="mt-1 text-xs text-muted">Coche toutes les couleurs jouées dans le deck.</p>}
    </fieldset>
  );
}

/** Liste déroulante de l'archétype (un seul, facultatif). */
export function ArchetypeSelect({
  archetypes,
  defaultId = null,
  className,
}: {
  archetypes: Archetype[];
  defaultId?: number | null;
  className: string;
}) {
  return (
    <select name="archetype_id" defaultValue={defaultId ?? ""} className={className}>
      <option value="">Non classé</option>
      {archetypes.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  );
}
