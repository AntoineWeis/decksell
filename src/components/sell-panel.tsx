"use client";

import { submitWithoutReset } from "@/lib/form";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { createListing, type SellState } from "@/app/listing-actions";
import { formatEur, parseEur, type Estimate, type ManualPrices } from "@/lib/pricing";
import { canLeadDeck, checkDeckQuality, priceGap } from "@/lib/quality";
import { normalizeName, type DetectedFormat, type ParsedDeck } from "@/lib/decklist";
import { normalizeColors, type Archetype } from "@/lib/listings";
import { BRACKETS, allowedBrackets, type BracketLevel } from "@/lib/bracket";
import { ArchetypeSelect, ColorPicker } from "./deck-tags-fields";
import { FormatSelect } from "./format-select";
import { CardDetailsEditor } from "./card-details-editor";
import { useActionToast } from "./toaster";

const inputClass =
  "w-full rounded-lg border border-line bg-sunken px-3 py-2 outline-none focus:border-link focus:ring-2 focus:ring-link/25";

/** Mise en vente du deck qui vient d'être estimé. */
export function SellPanel({
  decklist,
  estimate,
  manual,
  archetypes,
  deck,
  onShapeChange,
  bracketMin,
}: {
  decklist: string;
  estimate: Estimate;
  manual: ManualPrices;
  archetypes: Archetype[];
  /** Liste avec le format et le(s) commandant(s) retenus. */
  deck: ParsedDeck;
  /** Le vendeur change de format ou de commandant : l'estimation est refaite au-dessus. */
  onShapeChange: (format: DetectedFormat, commanders: string[]) => void;
  /** Niveau de puissance minimum (Commander) ; null tant qu'il est en calcul. */
  bracketMin: BracketLevel | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<SellState, FormData>(createListing, { status: "idle" });
  useActionToast(state, {});
  const suggested = (Math.round(estimate.totalCents / 100) || 1).toString();
  const [asking, setAsking] = useState(suggested);
  const quality = useMemo(() => checkDeckQuality(estimate, deck), [estimate, deck]);
  const gap = priceGap(parseEur(asking), estimate.totalCents);
  const blocked = quality.blocking.length > 0;
  const commander = deck.format === "commander";

  // Commandants possibles : les créatures et planeswalkers légendaires de la liste (réserve comprise).
  const candidates = useMemo(() => {
    const seen = new Set<string>();
    return estimate.lines
      .filter((l) => canLeadDeck(l.card?.typeLine) || deck.commanders.some((c) => normalizeName(c) === normalizeName(l.name)))
      .filter((l) => !seen.has(normalizeName(l.name)) && seen.add(normalizeName(l.name)))
      .map((l) => l.name)
      .sort((a, b) => a.localeCompare(b, "fr"));
  }, [estimate, deck.commanders]);

  // Couleurs proposées en Commander : l'identité de couleur du ou des commandants.
  const identity = useMemo(() => {
    if (!commander) return [];
    const keys = new Set(deck.commanders.map(normalizeName));
    return normalizeColors(
      estimate.lines.filter((l) => keys.has(normalizeName(l.name))).flatMap((l) => l.card?.colorIdentity ?? []),
    );
  }, [commander, deck.commanders, estimate]);

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-4">
        <div>
          <p className="text-lg font-semibold">Tu veux vendre ce deck ?</p>
          <p className="text-sm text-muted">Crée une annonce en un clic et suis-la depuis ton espace.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-10 rounded-lg bg-accent px-4 font-semibold text-on-accent transition hover:bg-accent-hover"
        >
          Mettre en vente
        </button>
      </div>
    );
  }

  const setCommander = (index: number, name: string) => {
    const next = [...deck.commanders];
    if (name === "") next.splice(index, 1);
    else next[index] = name;
    onShapeChange("commander", [...new Set(next.filter(Boolean))]);
  };

  return (
    <form onSubmit={submitWithoutReset(action)} className="rounded-xl border border-link/40 bg-surface p-5">
      <h2 className="text-lg font-semibold">Mettre ce deck en vente</h2>
      <p className="mt-1 text-sm text-muted">
        Valeur estimée : {formatEur(estimate.totalCents)}
        {!estimate.complete && " (incomplète)"}. Tu restes libre de ton prix.
      </p>

      {blocked && (
        <div role="alert" className="mt-3 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          <p className="font-semibold">Ce deck ne peut pas être publié en l&apos;état :</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {quality.blocking.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <p className="mt-1">Corrige la liste à gauche, puis relance l&apos;estimation.</p>
        </div>
      )}
      {quality.warnings.map((m) => (
        <p key={m} className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
          {m}
        </p>
      ))}

      <input type="hidden" name="decklist" value={decklist} />
      <input type="hidden" name="manual" value={JSON.stringify(manual)} />
      {deck.commanders.map((c) => (
        <input key={c} type="hidden" name="commanders" value={c} />
      ))}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="sm:col-span-3">
          <span className="mb-1 block text-sm font-medium">Titre de l&apos;annonce</span>
          <input
            name="title"
            required
            minLength={3}
            maxLength={80}
            placeholder={commander ? "Atraxa Superfriends, sleevé" : "Eldrazi Ramp complet, sleevé"}
            className={inputClass}
          />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium">Format de jeu</span>
          <FormatSelect
            className={inputClass}
            value={deck.format}
            onChange={(f) => onShapeChange(f, f === "commander" ? deck.commanders : [])}
          />
        </label>
        {commander ? (
          <>
            <label>
              <span className="mb-1 block text-sm font-medium">
                Commandant<span className="text-danger"> *</span>
              </span>
              <CommanderSelect
                value={deck.commanders[0] ?? ""}
                options={candidates.filter((c) => c !== deck.commanders[1])}
                placeholder="Choisir…"
                onChange={(v) => setCommander(0, v)}
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">
                2<sup>e</sup> commandant <span className="font-normal text-muted">(facultatif)</span>
              </span>
              <CommanderSelect
                value={deck.commanders[1] ?? ""}
                options={candidates.filter((c) => c !== deck.commanders[0])}
                placeholder="Aucun"
                disabled={deck.commanders.length === 0}
                onChange={(v) => setCommander(1, v)}
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">Niveau de puissance</span>
              {/* Recréé quand le minimum change : il repart du niveau déduit de la liste. */}
              <select key={bracketMin ?? "calcul"} name="bracket" defaultValue={bracketMin ?? ""} disabled={bracketMin == null} className={inputClass}>
                {bracketMin == null ? (
                  <option value="">Calcul…</option>
                ) : (
                  allowedBrackets(bracketMin).map((b) => (
                    <option key={b} value={b}>
                      {b} · {BRACKETS[b].name}
                      {b === bracketMin ? " (d'après la liste)" : ""}
                    </option>
                  ))
                )}
              </select>
            </label>
            <div className="sm:col-span-3">
              {/* Recréé quand les commandants changent : les cases suivent leur identité de couleur. */}
              <ColorPicker key={identity.join("")} defaultColors={identity} />
            </div>
          </>
        ) : (
          <>
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Archétype</span>
              <ArchetypeSelect archetypes={archetypes} className={inputClass} />
            </label>
            <div className="sm:col-span-3">
              <ColorPicker required />
            </div>
          </>
        )}
        <label>
          <span className="mb-1 block text-sm font-medium">Prix demandé</span>
          <span className="relative block">
            <input
              name="asking_price"
              required
              inputMode="decimal"
              value={asking}
              onChange={(e) => setAsking(e.target.value)}
              aria-describedby={gap.message ? "price-gap" : undefined}
              className={`${inputClass} pr-8 tabular-nums ${gap.level !== "ok" ? "border-warn" : ""}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">€</span>
          </span>
        </label>
        {gap.message && (
          <p id="price-gap" className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn sm:col-span-3">
            {gap.message}
          </p>
        )}
        <div className="sm:col-span-3">
          <CardDetailsEditor lines={estimate.lines.map(({ board, name, quantity }) => ({ board, name, quantity }))} />
        </div>
        <label className="sm:col-span-3">
          <span className="mb-1 block text-sm font-medium">
            Description <span className="font-normal text-muted">(facultatif)</span>
          </span>
          <textarea
            name="description"
            rows={3}
            maxLength={2000}
            placeholder="Sleeves, deck box, conditions d'envoi…"
            className={`${inputClass} resize-y`}
          />
        </label>
      </div>

      {state.status === "error" && <p className="mt-3 text-sm text-danger">{state.message}</p>}
      {state.status === "auth" && (
        <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
          Connecte-toi pour publier l&apos;annonce : ta liste est gardée.{" "}
          <Link href="/connexion?next=/estimer" className="font-semibold underline">
            Se connecter
          </Link>{" "}
          ou{" "}
          <Link href="/inscription?next=/estimer" className="font-semibold underline">
            créer un compte
          </Link>
          .
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending || blocked || (commander && bracketMin == null)}
          className="h-10 rounded-xl bg-accent px-4 font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Publication…" : "Publier l'annonce"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl px-4 text-muted hover:bg-sunken">
          Annuler
        </button>
      </div>
    </form>
  );
}

/** Choix d'un commandant parmi les cartes légendaires de la liste. */
function CommanderSelect({
  value,
  options,
  placeholder,
  disabled = false,
  onChange,
}: {
  value: string;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      <option value="">{placeholder}</option>
      {options.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}
