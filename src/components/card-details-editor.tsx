"use client";

import { useMemo, useState } from "react";
import { CONDITIONS, type Condition } from "@/lib/listings";
import {
  CONDITION_SHORT,
  LANGUAGES,
  detailKey,
  detailsByKey,
  frenchPercentOf,
  hasMixedConditions,
  type Board,
  type CardDetail,
  type Language,
} from "@/lib/card-details";

type Line = { board: Board; name: string; quantity: number };

const selectClass =
  "h-9 rounded-lg border border-line bg-sunken px-2 text-sm outline-none focus:border-link focus:ring-2 focus:ring-link/25";

/**
 * Saisie de l'état et de la langue des cartes : d'abord pour tout le deck, puis,
 * si besoin, carte par carte. Le résultat part dans un champ caché (JSON) nommé `name`.
 */
export function CardDetailsEditor({
  lines,
  initial,
  name = "card_details",
}: {
  lines: Line[];
  initial?: CardDetail[];
  name?: string;
}) {
  const [details, setDetails] = useState<CardDetail[]>(() => {
    const known = detailsByKey(initial);
    return lines.map((l) => {
      const d = known.get(detailKey(l.board, l.name));
      return { ...l, condition: d?.condition ?? "near_mint", lang: d?.lang ?? "en" };
    });
  });
  const [open, setOpen] = useState(false);

  const total = details.reduce((n, d) => n + d.quantity, 0);
  const french = frenchPercentOf(details) ?? 0;
  const mixed = hasMixedConditions(details);
  const allCondition = mixed ? "" : (details[0]?.condition ?? "near_mint");
  const langs = new Set(details.map((d) => d.lang));
  const allLang = langs.size === 1 ? [...langs][0] : "";

  const setAll = (patch: Partial<Pick<CardDetail, "condition" | "lang">>) =>
    setDetails((ds) => ds.map((d) => ({ ...d, ...patch })));
  const setOne = (i: number, patch: Partial<Pick<CardDetail, "condition" | "lang">>) =>
    setDetails((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  const json = useMemo(
    () => JSON.stringify(details.map(({ board, name, condition, lang }) => ({ board, name, condition, lang }))),
    [details],
  );

  return (
    <fieldset className="rounded-lg border border-line p-3 sm:p-4">
      <legend className="px-1 text-sm font-medium">État et langue des cartes</legend>
      <input type="hidden" name={name} value={json} />

      <div className="flex flex-wrap items-end gap-3">
        <label>
          <span className="mb-1 block text-xs text-muted">État de tout le deck</span>
          <select
            name="condition"
            value={allCondition}
            onChange={(e) => e.target.value && setAll({ condition: e.target.value as Condition })}
            className={selectClass}
          >
            {mixed && <option value="">État mixte</option>}
            {Object.entries(CONDITIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs text-muted">Langue de tout le deck</span>
          <select
            value={allLang}
            onChange={(e) => e.target.value && setAll({ lang: e.target.value as Language })}
            className={selectClass}
          >
            {!allLang && <option value="">Langues mixtes</option>}
            {Object.entries(LANGUAGES).map(([value, l]) => (
              <option key={value} value={value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <p className="pb-2 text-xs text-muted">
          {total} cartes · <span className="font-semibold text-foreground tabular-nums">{french} %</span> en français
        </p>
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-3 text-sm font-medium text-link hover:underline"
      >
        {open ? "Masquer le détail carte par carte" : "Préciser carte par carte"}
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {(["main", "side"] as const).map((board) => {
            const rows = details.map((d, i) => ({ d, i })).filter(({ d }) => d.board === board);
            if (rows.length === 0) return null;
            return (
              <div key={board}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  {board === "main" ? "Deck principal" : "Réserve"}
                </p>
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {rows.map(({ d, i }) => (
                    <li key={`${d.board}-${d.name}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2">
                      <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted">{d.quantity}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{d.name}</span>
                      <span className="flex gap-1.5">
                        <select
                          aria-label={`État de ${d.name}`}
                          value={d.condition}
                          onChange={(e) => setOne(i, { condition: e.target.value as Condition })}
                          className={`${selectClass} h-8`}
                        >
                          {Object.entries(CONDITIONS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {CONDITION_SHORT[value as Condition]} · {label}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label={`Langue de ${d.name}`}
                          value={d.lang}
                          onChange={(e) => setOne(i, { lang: e.target.value as Language })}
                          className={`${selectClass} h-8`}
                        >
                          {Object.entries(LANGUAGES).map(([value, l]) => (
                            <option key={value} value={value}>
                              {l.short} · {l.label}
                            </option>
                          ))}
                        </select>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <p className="text-xs text-muted">
            Tous les exemplaires d&apos;une même ligne partagent le même état et la même langue.
          </p>
        </div>
      )}
    </fieldset>
  );
}
