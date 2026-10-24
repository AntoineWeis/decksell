import type { MetaMatch, MetaResult } from "@/lib/meta-match";
import type { CardDiff } from "@/lib/similarity";
import type { VerdictKey } from "@/lib/meta-config";
import { verdictOf } from "@/lib/similarity";

export const VERDICT_TONE: Record<VerdictKey, { text: string; bar: string; badge: string }> = {
  meta: { text: "text-ok", bar: "bg-ok", badge: "bg-ok-soft text-ok" },
  close: { text: "text-link", bar: "bg-link", badge: "bg-brand-soft text-link" },
  variant: { text: "text-warn", bar: "bg-warn", badge: "bg-warn-soft text-warn" },
  off: { text: "text-muted", bar: "bg-muted", badge: "bg-sunken text-muted" },
};

const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/** « 3e », « 1er », « Top 8 », « 5-0 ». */
function placementLabel(p: string | null): string | null {
  if (!p) return null;
  if (/^\d+-0$/.test(p)) return `${p} en League`;
  if (/^\d+-\d+$/.test(p)) return `Top ${p.split("-")[1]}`;
  return p === "1" ? "1er" : `${p}e`;
}

function MatchLine({ m }: { m: MetaMatch }) {
  const d = m.deck;
  const parts = [d.event_name, shortDate(d.event_date), placementLabel(d.placement), d.player].filter(Boolean);
  return (
    <>
      <span className="font-medium text-foreground">{d.archetype ?? "Archétype non nommé"}</span>
      <span className="text-muted"> · {parts.join(" · ")}</span>
    </>
  );
}

function DiffColumn({ title, rows, kind }: { title: string; rows: CardDiff[]; kind: "shared" | "extra" | "missing" }) {
  if (rows.length === 0) return null;
  const shown = rows.slice(0, 8);
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-muted">{title}</p>
      <ul className="space-y-0.5 text-sm">
        {shown.map((r) => (
          <li key={r.name} className="flex justify-between gap-2">
            <span className="truncate">{r.name}</span>
            <span className="shrink-0 tabular-nums text-muted">
              {kind === "shared" ? Math.min(r.mine, r.theirs) : kind === "extra" ? `+${r.mine - r.theirs}` : `−${r.theirs - r.mine}`}
            </span>
          </li>
        ))}
      </ul>
      {rows.length > shown.length && <p className="mt-1 text-xs text-muted">et {rows.length - shown.length} autre{rows.length - shown.length > 1 ? "s" : ""}</p>}
    </div>
  );
}

/**
 * Encadré « Proximité méta » d'une annonce : score de 0 à 100 face aux listes de tournoi
 * récentes, liste la plus proche, autres archétypes proches, et ce qui diffère.
 * Mesure la ressemblance des listes, jamais leur niveau de jeu.
 */
export function MetaProximityCard({ result }: { result: MetaResult }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold">Proximité méta</h2>

      {result.status === "empty" && (
        <p className="mt-2 text-sm text-muted">Comparaison disponible après le premier import des résultats de tournoi.</p>
      )}
      {result.status === "invalid" && <p className="mt-2 text-sm text-muted">{result.reason}</p>}

      {result.status !== "empty" && result.status !== "invalid" && (
        <>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="leading-none">
              <span className="display text-4xl tabular-nums">{result.score}</span>
              <span className="text-sm text-muted"> / 100</span>
            </p>
            <p className={`text-right text-sm font-semibold ${VERDICT_TONE[result.verdict.key].text}`}>
              {result.status === "unreliable" ? "Score fragile" : result.verdict.label}
            </p>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-sunken" aria-hidden>
            <div className={`h-full rounded-full ${VERDICT_TONE[result.verdict.key].bar}`} style={{ width: `${result.score}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">{result.verdict.hint}</p>

          <p className="mt-4 text-sm">
            <span className="block text-xs text-muted">Liste de tournoi la plus proche</span>
            {result.best.deck.source_url ? (
              <a href={result.best.deck.source_url} target="_blank" rel="noopener noreferrer nofollow" className="hover:underline">
                <MatchLine m={result.best} /> <span className="text-link">↗</span>
              </a>
            ) : (
              <MatchLine m={result.best} />
            )}
          </p>

          {result.alsoClose.length > 0 && (
            <p className="mt-2 text-xs text-muted">
              Proche aussi de :{" "}
              {result.alsoClose.map((m, i) => (
                <span key={m.deck.id}>
                  {i > 0 && ", "}
                  {m.deck.archetype} <span className="tabular-nums">({m.comparison.score})</span>
                </span>
              ))}
            </p>
          )}

          {result.warnings.length > 0 && (
            <ul className="mt-3 space-y-0.5 text-xs text-warn">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          <details className="group mt-4 border-t border-line pt-3">
            <summary className="cursor-pointer list-none text-sm font-medium text-link hover:underline">
              <span className="group-open:hidden">Comparer avec cette liste</span>
              <span className="hidden group-open:inline">Masquer la comparaison</span>
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-1">
              <DiffColumn title="Cœur commun" rows={result.diff.main.shared} kind="shared" />
              <DiffColumn title="En plus dans ce deck" rows={result.diff.main.extra} kind="extra" />
              <DiffColumn title="Absent de ce deck" rows={result.diff.main.missing} kind="missing" />
            </div>
            {result.best.comparison.side != null && (
              <p className="mt-3 text-xs text-muted">
                Réserve : {Math.round(result.best.comparison.side * 100)} % de ressemblance
                {result.diff.side.extra.length > 0 && ` · ${result.diff.side.extra.length} carte${result.diff.side.extra.length > 1 ? "s" : ""} différente${result.diff.side.extra.length > 1 ? "s" : ""}`}
                .
              </p>
            )}
          </details>

          <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
            Ressemblance avec {result.corpusSize} listes de tournoi Modern récentes (résultats officiels MTGO). Indique à quel point
            la liste est proche du méta, pas son niveau de jeu ni ses résultats.
          </p>
        </>
      )}
    </div>
  );
}

/** Petit badge « Méta 82 » pour les vignettes (rien si le score est absent, invalide ou fragile). */
export function MetaBadge({ score, status }: { score: number | null | undefined; status: string | null | undefined }) {
  if (score == null || (status !== "ok" && status !== "partial")) return null;
  const key = verdictOf(score).key;
  if (key === "off") return null;
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${VERDICT_TONE[key].badge}`} title="Proximité avec les listes de tournoi récentes (0–100)">
      Méta {score}
    </span>
  );
}
