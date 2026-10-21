import { CURVE_BUCKETS, type ManaCurve } from "@/lib/deck-stats";

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/** Courbe de mana du deck principal : une barre par valeur de mana, terrains à part. */
export function ManaCurveCard({ curve }: { curve: ManaCurve | null }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Courbe de mana</h2>
        {curve?.average != null && (
          <p className="text-sm text-muted">
            Moyenne <span className="font-semibold tabular-nums text-foreground">{curve.average.toFixed(2).replace(".", ",")}</span>
          </p>
        )}
      </div>

      {curve ? <Chart curve={curve} /> : <p className="mt-3 text-sm text-muted">Courbe disponible au prochain import des prix.</p>}
    </div>
  );
}

function Chart({ curve }: { curve: ManaCurve }) {
  const max = Math.max(1, ...curve.counts);
  return (
    <>
      {/* Barres : décoratives pour les lecteurs d'écran, qui lisent le tableau ci-dessous */}
      <div aria-hidden className="mt-4">
        <div className="flex h-32 items-end gap-0.5 border-b border-line">
          {curve.counts.map((n, i) => (
            <div key={CURVE_BUCKETS[i]} className="group relative flex h-full flex-1 flex-col items-center justify-end">
              {n > 0 && <span className="mb-1 text-xs font-medium tabular-nums text-muted group-hover:text-foreground">{n}</span>}
              <div
                className="w-full max-w-7 rounded-t-[4px] bg-accent transition group-hover:bg-accent-hover"
                style={{ height: n > 0 ? `calc((100% - 1.25rem) * ${n / max})` : 0 }}
              />
              {/* Infobulle au survol */}
              <span className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow group-hover:block">
                {plural(n, "carte")} à {CURVE_BUCKETS[i]} mana
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-0.5">
          {CURVE_BUCKETS.map((b) => (
            <span key={b} className="flex-1 text-center text-xs tabular-nums text-muted">
              {b}
            </span>
          ))}
        </div>
      </div>

      <table className="sr-only">
        <caption>Nombre de cartes du deck principal par valeur de mana, terrains exclus</caption>
        <thead>
          <tr>
            <th scope="col">Valeur de mana</th>
            <th scope="col">Cartes</th>
          </tr>
        </thead>
        <tbody>
          {curve.counts.map((n, i) => (
            <tr key={CURVE_BUCKETS[i]}>
              <th scope="row">{CURVE_BUCKETS[i]}</th>
              <td>{n}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-sm text-muted">
        <span>
          <span className="font-semibold tabular-nums text-foreground">{curve.spells}</span> sorts et créatures
        </span>
        <span>
          <span className="font-semibold tabular-nums text-foreground">{curve.lands}</span> terrains
        </span>
      </p>
      {curve.unknown > 0 && (
        <p className="mt-1 text-xs text-muted">{plural(curve.unknown, "carte")} sans donnée, non comptée{curve.unknown > 1 ? "s" : ""}.</p>
      )}
    </>
  );
}
