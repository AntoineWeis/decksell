"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = { name: string; french: string | null };

/**
 * Champ de recherche par carte avec suggestions (noms anglais et français) pendant la frappe.
 * Choisir une suggestion remplit le nom anglais ; sans JavaScript, c'est un champ texte normal.
 */
export function CardSearchInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const last = useRef("");

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function onInput(e: React.FormEvent<HTMLInputElement>) {
    const q = e.currentTarget.value.trim();
    window.clearTimeout(timer.current);
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    // Petite pause avant de chercher : une requête par mot tapé, pas par lettre.
    timer.current = window.setTimeout(async () => {
      last.current = q;
      try {
        const res = await fetch(`/api/cartes?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as Suggestion[];
        if (last.current === q) setSuggestions(data);
      } catch {
        // Pas de suggestions : la recherche marche quand même.
      }
    }, 250);
  }

  return (
    <>
      <input {...props} list="card-suggestions" onInput={onInput} />
      <datalist id="card-suggestions">
        {suggestions.map((s) => (
          <option key={s.name} value={s.name} label={s.french ?? undefined} />
        ))}
      </datalist>
    </>
  );
}
