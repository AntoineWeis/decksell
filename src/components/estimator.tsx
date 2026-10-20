"use client";

import { useActionState, useMemo, useState } from "react";
import { estimateAction, type EstimateState } from "@/app/actions";
import { normalizeName } from "@/lib/decklist";
import { buildEstimate, formatEur, type Estimate, type ManualPrices, type PricedLine } from "@/lib/pricing";
import { SAMPLE_DECK } from "@/lib/sample-deck";
import { CardList } from "./card-list";

/** "3,50" ou "3.5" -> 350 centimes ; null si vide ou invalide. */
function parseEurInput(raw: string): number | null {
  const v = Number(raw.replace(",", ".").replace(/[€\s]/g, ""));
  return raw.trim() !== "" && Number.isFinite(v) && v >= 0 ? Math.round(v * 100) : null;
}

export function Estimator() {
  const [text, setText] = useState("");
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});
  const [state, formAction, pending] = useActionState<EstimateState, FormData>(estimateAction, { status: "idle" });

  const manual = useMemo(() => {
    const out: ManualPrices = {};
    for (const [key, raw] of Object.entries(manualInputs)) {
      const cents = parseEurInput(raw);
      if (cents != null) out[key] = cents;
    }
    return out;
  }, [manualInputs]);

  const estimate = useMemo(
    () => (state.status === "ok" ? buildEstimate(state.deck, state.prices, manual) : null),
    [state, manual],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
      <form action={formAction} className="rounded-2xl border border-line bg-surface p-4 sm:p-5 lg:sticky lg:top-6">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <label htmlFor="decklist" className="font-semibold">
            Ta decklist
          </label>
          <button
            type="button"
            onClick={() => setText(SAMPLE_DECK)}
            className="text-sm text-accent underline-offset-2 hover:underline"
          >
            Essayer avec un exemple
          </button>
        </div>
        <textarea
          id="decklist"
          name="decklist"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          spellCheck={false}
          rows={16}
          placeholder={"4 Lightning Bolt\n4 Ragavan, Nimble Pilferer\n...\n\nSideboard\n2 Engineered Explosives"}
          className="block w-full resize-y rounded-xl border border-line bg-sunken px-3 py-2.5 font-mono text-sm leading-6 outline-none placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
        <p className="mt-2 text-xs text-muted">
          Une carte par ligne. Formats MTGO, Arena, Moxfield et MTGGoldfish acceptés.
        </p>
        <button
          type="submit"
          disabled={pending || text.trim() === ""}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-on-accent transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          {pending ? "Estimation…" : "Estimer le deck"}
        </button>
      </form>

      <div className={`space-y-5 transition-opacity ${pending ? "opacity-60" : ""}`} aria-live="polite">
        {state.status === "idle" && <EmptyState />}
        {state.status === "error" && (
          <div className="rounded-2xl border border-danger/30 bg-danger-soft px-5 py-4 text-danger">{state.message}</div>
        )}
        {state.status === "ok" && estimate && (
          <>
            <Summary estimate={estimate} pricesAsOf={state.pricesAsOf} />
            <ParseNotes deck={state.deck} />
            {!estimate.complete || Object.keys(manual).length > 0 ? (
              <MissingPrices
                lines={estimate.lines.filter((l) => l.unitCents == null || l.status === "manual")}
                complete={estimate.complete}
                inputs={manualInputs}
                onChange={(key, value) => setManualInputs((m) => ({ ...m, [key]: value }))}
              />
            ) : null}
            <CardList
              title="Deck principal"
              lines={estimate.lines.filter((l) => l.board === "main")}
              totalCents={estimate.mainCents}
            />
            <CardList
              title="Réserve"
              lines={estimate.lines.filter((l) => l.board === "side")}
              totalCents={estimate.sideCents}
            />
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  const steps = [
    ["Colle ta liste", "Exporte-la depuis MTGO, Arena, Moxfield ou MTGGoldfish."],
    ["Obtiens le prix", "Chaque carte au prix de son impression la moins chère sur Cardmarket."],
    ["Complète si besoin", "Une carte sans prix ? Indique le tien, le total se met à jour."],
  ];
  return (
    <div className="rounded-2xl border border-dashed border-line px-5 py-8 sm:px-8">
      <ol className="space-y-5">
        {steps.map(([title, text], i) => (
          <li key={title} className="flex gap-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
              {i + 1}
            </span>
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Summary({ estimate, pricesAsOf }: { estimate: Estimate; pricesAsOf: string | null }) {
  const priced = estimate.lines.filter((l) => l.lineCents != null);
  const top = [...priced].sort((a, b) => b.lineCents! - a.lineCents!).slice(0, 5);
  const topCents = top.reduce((n, l) => n + l.lineCents!, 0);
  const topShare = estimate.totalCents > 0 ? Math.round((topCents / estimate.totalCents) * 100) : 0;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">Valeur estimée</p>
        {estimate.complete ? (
          <span className="rounded-full bg-ok-soft px-2.5 py-1 text-xs font-medium text-ok">Estimation complète</span>
        ) : (
          <span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs font-medium text-warn">
            Incomplète · {estimate.unpricedCardCount} carte{estimate.unpricedCardCount > 1 ? "s" : ""} sans prix
          </span>
        )}
      </div>
      <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
        {formatEur(estimate.totalCents)}
        {!estimate.complete && <span className="ml-1 align-top text-2xl text-warn">+</span>}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Deck principal" value={formatEur(estimate.mainCents)} />
        <Stat label="Réserve" value={formatEur(estimate.sideCents)} />
        {top.length > 0 && (
          <Stat
            label={`${top.length} cartes les plus chères`}
            value={`${topShare} % du total`}
            className="col-span-2 sm:col-span-1"
          />
        )}
      </dl>

      <p className="mt-4 text-xs text-muted">
        Prix Cardmarket (impression non-foil la moins chère), via Scryfall
        {pricesAsOf && <> · mis à jour le {new Date(pricesAsOf).toLocaleDateString("fr-FR")}</>}. Indicatif : ce
        n&apos;est pas un prix de revente.
      </p>
    </section>
  );
}

function Stat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-xl bg-sunken px-3 py-2.5 ${className}`}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function ParseNotes({ deck }: { deck: Extract<EstimateState, { status: "ok" }>["deck"] }) {
  if (deck.errors.length === 0 && deck.warnings.length === 0) return null;
  return (
    <details className="rounded-2xl border border-line bg-surface px-5 py-3 text-sm">
      <summary className="cursor-pointer font-medium">
        {deck.errors.length > 0
          ? `${deck.errors.length} ligne${deck.errors.length > 1 ? "s" : ""} ignorée${deck.errors.length > 1 ? "s" : ""}`
          : "Remarques sur la liste"}
        {deck.warnings.length > 0 && deck.errors.length > 0 && " · remarques"}
      </summary>
      <ul className="mt-2 space-y-1 text-muted">
        {deck.warnings.map((w) => (
          <li key={w}>{w}</li>
        ))}
        {deck.errors.map((e) => (
          <li key={e.line}>
            Ligne {e.line} : <code className="rounded bg-sunken px-1">{e.text.trim()}</code>
          </li>
        ))}
      </ul>
    </details>
  );
}

function MissingPrices({
  lines,
  complete,
  inputs,
  onChange,
}: {
  lines: PricedLine[];
  complete: boolean;
  inputs: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  if (lines.length === 0) return null;
  return (
    <section
      className={`rounded-2xl border p-5 ${complete ? "border-line bg-surface" : "border-warn/30 bg-warn-soft/60"}`}
    >
      <h2 className="font-semibold">{complete ? "Prix saisis à la main" : "Cartes à compléter"}</h2>
      <p className="mt-1 text-sm text-muted">
        {complete
          ? "Ces prix sont inclus dans le total. Vide un champ pour retirer la carte du total."
          : "Les cartes sans prix ne sont pas comptées dans le total. Indique un prix à l’unité pour les inclure."}
      </p>
      <ul className="mt-4 space-y-2">
        {lines.map((l) => {
          const key = normalizeName(l.name);
          const foil = l.card?.minPriceEurFoil;
          return (
            <li
              key={`${l.board}-${l.name}`}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-surface px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {l.quantity} × {l.name}
                </p>
                <p className="text-xs text-muted">
                  {l.status === "manual"
                    ? "Prix saisi"
                    : l.status === "not_found"
                      ? "Nom introuvable : vérifie l'orthographe"
                      : foil != null
                        ? `Existe seulement en foil (dès ${formatEur(Math.round(foil * 100))})`
                        : "Aucun prix sur Cardmarket"}
                </p>
              </div>
              <label className="flex items-center gap-1.5 text-sm">
                <span className="sr-only">Prix unitaire de {l.name}</span>
                <input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={inputs[key] ?? ""}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="w-24 rounded-lg border border-line bg-sunken px-2 py-1.5 text-right tabular-nums outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                />
                <span className="text-muted">€</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
