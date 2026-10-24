import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { gatherBadgeStats } from "@/lib/badge-stats";
import { getUserBadges, refreshUserBadges } from "@/lib/badges-server";
import { BADGES, ROMAN, nextStep, type BadgeDef, type BadgeFamily, type BadgeStats } from "@/lib/badges";
import { BadgeMedal } from "@/components/badge-medal";

export const metadata: Metadata = { title: "Mes badges" };

const FAMILIES: { key: BadgeFamily; title: string; hint: string }[] = [
  { key: "trust", title: "Confiance", hint: "Affichés en priorité à côté de ton nom sur tes annonces." },
  { key: "quality", title: "Qualité des annonces", hint: "Des annonces complètes et proches du méta." },
  { key: "journey", title: "Premiers pas", hint: "Pour bien démarrer sur decksell." },
];

export default function BadgesPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-sunken" />}>
      <Badges />
    </Suspense>
  );
}

/** Ce qu'il reste à faire pour le prochain niveau, en clair. */
function progressText(def: BadgeDef, stats: BadgeStats, level: number): string | null {
  const step = nextStep(def, stats);
  if (!step) return level >= 3 ? "Niveau maximum atteint." : null;
  const target = def.levels![step.level - 1];
  const name = `niveau ${ROMAN[step.level]}`;
  if (def.lowerIsBetter) return `Réponds en moins de ${target} h (médiane) pour le ${name}.`;
  if (def.key === "veteran" && stats.listings === 0) return "Publie une première annonce pour commencer.";
  if (step.remaining == null) return null;
  const unit = step.remaining > 1 ? def.unit : def.unit?.replace(/s$/, "");
  return `Encore ${step.remaining} ${unit} pour le ${name}.`;
}

async function Badges() {
  const user = await requireUser("/espace/badges");
  // Recalcul à la visite : les membres inscrits avant les badges les obtiennent ici.
  await refreshUserBadges(user.id);
  const [stats, earned] = await Promise.all([gatherBadgeStats(getSupabaseAdmin(), user.id), getUserBadges(user.id)]);
  const levels = new Map(earned.map((b) => [b.key, b.level]));
  const count = earned.length;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="display text-2xl">Mes badges</h2>
        <p className="mt-1 text-sm text-muted">
          {count === 0
            ? "Aucun badge pour l'instant. Ils récompensent ce qui rassure les acheteurs : réponses rapides, prix justes, annonces complètes."
            : `${count} badge${count > 1 ? "s" : ""} sur ${BADGES.length}. Un badge obtenu reste acquis.`}
        </p>
      </div>

      {FAMILIES.map((family) => (
        <section key={family.key}>
          <h2 className="font-semibold">{family.title}</h2>
          <p className="text-sm text-muted">{family.hint}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {BADGES.filter((d) => d.family === family.key).map((def) => {
              const level = levels.get(def.key) ?? 0;
              const progress = stats ? progressText(def, stats, level) : null;
              return (
                <li
                  key={def.key}
                  className={`flex items-start gap-4 rounded-xl border p-4 ${level ? "border-line bg-surface" : "border-dashed border-line"}`}
                >
                  <BadgeMedal
                    badgeKey={def.key}
                    level={Math.max(1, level)}
                    size={48}
                    className={level ? "" : "opacity-35 grayscale [&>span:last-child]:hidden"}
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-semibold">
                      {def.levels && level ? `${def.label} ${ROMAN[level]}` : def.label}
                      {!level && <span className="rounded-full bg-sunken px-2 py-0.5 text-xs font-medium text-muted">À débloquer</span>}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-muted">{def.description}</span>
                    {progress && <span className="mt-1.5 block text-xs font-medium text-link">{progress}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
