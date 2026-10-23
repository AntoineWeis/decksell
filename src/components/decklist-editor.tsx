"use client";

import { useActionState, useMemo, useState } from "react";
import { submitWithoutReset } from "@/lib/form";
import { parseDecklist } from "@/lib/decklist";
import { updateDecklist, type DecklistState } from "@/app/espace/actions";
import { useActionToast } from "./toaster";

/**
 * Module « Liste au format texte » de la page de gestion : lecture, puis modification
 * de la liste (coller un export Moxfield, Arena, MTGO… ou corriger à la main).
 */
export function DecklistEditor({ listingId, decklist }: { listingId: string; decklist: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(decklist);
  const [state, action, saving] = useActionState<DecklistState, FormData>(updateDecklist.bind(null, listingId), {
    status: "idle",
  });
  useActionToast(state, { success: "Liste enregistrée, estimation recalculée" });

  // Une fois la liste enregistrée, on revient en lecture (ajustement pendant le rendu, sans effet).
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.status === "saved") setEditing(false);
  }
  // La liste enregistrée change après le rechargement de la page : le texte la suit hors édition.
  const [savedList, setSavedList] = useState(decklist);
  if (decklist !== savedList) {
    setSavedList(decklist);
    if (!editing) setText(decklist);
  }

  const preview = useMemo(() => parseDecklist(text), [text]);
  const changed = text.trim() !== decklist.trim();

  if (!editing) {
    return (
      <details className="group rounded-xl border border-line bg-surface px-5 py-3 text-sm">
        <summary className="flex cursor-pointer items-center justify-between gap-3 font-medium">
          Liste au format texte
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setText(decklist);
              setEditing(true);
            }}
            className="rounded-lg border border-line px-3 py-1 text-xs font-semibold text-link transition hover:border-link/50 hover:bg-brand-soft"
          >
            Modifier la liste
          </button>
        </summary>
        <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-sunken p-3 font-mono text-xs leading-5">{decklist}</pre>
        {state.status === "saved" && "ignored" in state && state.ignored > 0 && (
          <p className="mt-2 text-xs text-warn">
            {state.ignored} ligne{state.ignored > 1 ? "s" : ""} non reconnue{state.ignored > 1 ? "s" : ""} ignorée
            {state.ignored > 1 ? "s" : ""}.
          </p>
        )}
      </details>
    );
  }

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-3 rounded-xl border border-link/40 bg-surface p-4 text-sm sm:p-5">
      <div>
        <h3 className="font-semibold">Modifier la liste</h3>
        <p className="mt-0.5 text-xs text-muted">
          Colle un export Moxfield, Arena ou MTGO, ou corrige la liste à la main (une carte par ligne, « 4 Lightning
          Bolt », puis « Sideboard »). L&apos;estimation sera recalculée avec les prix du jour.
        </p>
      </div>
      <textarea
        name="decklist"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={18}
        spellCheck={false}
        autoFocus
        maxLength={20_000}
        className="block w-full resize-y rounded-lg border border-line bg-sunken p-3 font-mono text-xs leading-5 outline-none focus:border-link focus:ring-2 focus:ring-link/25"
      />
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums">
        <span className={preview.mainCount === 60 ? "text-ok" : "text-warn"}>{preview.mainCount} cartes en main</span>
        <span className="text-muted">{preview.sideCount} en réserve</span>
        {preview.errors.length > 0 && (
          <span className="text-warn" title={preview.errors.map((e) => `Ligne ${e.line} : ${e.text}`).join("\n")}>
            {preview.errors.length} ligne{preview.errors.length > 1 ? "s" : ""} non reconnue{preview.errors.length > 1 ? "s" : ""}
          </span>
        )}
      </p>
      {preview.warnings.length > 0 && (
        <ul className="space-y-0.5 text-xs text-warn">
          {preview.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted">
        L&apos;état et la langue des cartes déjà présentes sont conservés ; les nouvelles cartes prennent l&apos;état
        principal du deck et l&apos;anglais, modifiables ensuite.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving || !changed || preview.mainCount + preview.sideCount === 0}
          className="h-9 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Recalcul…" : "Enregistrer la liste"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="h-9 rounded-lg px-3 text-sm font-medium text-muted hover:text-foreground"
        >
          Annuler
        </button>
        {state.status === "error" && <span className="text-sm text-danger">{state.message}</span>}
      </div>
    </form>
  );
}
