// Badges des membres (vague 1). Fonctions pures : règles d'obtention à partir de faits
// vérifiables en base, jamais de déclaration. Testé dans tests/badges.test.ts.
// Principe : récompenser ce qui rend le site plus fiable (réactivité, prix justes, annonces
// complètes), jamais l'activité pour l'activité (pas de badge au nombre de messages).

export type BadgeFamily = "trust" | "quality" | "journey";

export type BadgeDef = {
  key: string;
  label: string;
  family: BadgeFamily;
  /** Ce qu'il faut faire, en clair (affiché sous le badge). */
  description: string;
  /** Seuils des niveaux I, II, III (absent : badge à niveau unique). */
  levels?: [number, number, number];
  /** Unité affichée pour la progression (« ventes », « h »…). */
  unit?: string;
  /** Vrai : plus la valeur est basse, mieux c'est (temps de réponse). */
  lowerIsBetter?: boolean;
};

export const BADGES: BadgeDef[] = [
  {
    key: "reactive",
    label: "Réactif",
    family: "trust",
    description: "Répond vite aux acheteurs (temps médian de première réponse, sur ses 10 dernières conversations).",
    levels: [24, 6, 1],
    unit: "h",
    lowerIsBetter: true,
  },
  {
    key: "fair-price",
    label: "Juste prix",
    family: "trust",
    description: "Publie ses decks à moins de 10 % de leur valeur estimée.",
    levels: [1, 5, 15],
    unit: "annonces",
  },
  { key: "veteran", label: "Ancien", family: "trust", description: "Membre depuis longtemps, avec au moins une annonce.", levels: [182, 365, 730], unit: "jours" },
  {
    key: "neat-listing",
    label: "Annonce soignée",
    family: "quality",
    description: "Une annonce complète : état et langue carte par carte, couleurs, archétype et description.",
  },
  { key: "meta-list", label: "Liste méta", family: "quality", description: "Une annonce à 75 ou plus de proximité avec le méta." },
  {
    key: "collector",
    label: "Collectionneur",
    family: "quality",
    description: "Des decks mis en vente dans plusieurs archétypes différents.",
    levels: [3, 6, 10],
    unit: "archétypes",
  },
  { key: "first-steps", label: "Premiers pas", family: "journey", description: "Un profil complet : photo, pseudo et lieu d'expédition." },
  { key: "estimator", label: "Estimateur", family: "journey", description: "Une première estimation transformée en annonce." },
];

export const BADGE_BY_KEY = new Map(BADGES.map((b) => [b.key, b]));

/** Faits utiles au calcul, lus en base (voir badge-stats.ts). */
export type BadgeStats = {
  /** Temps médian de première réponse aux acheteurs, en heures (null : moins de 3 conversations répondues). */
  medianReplyHours: number | null;
  /** Annonces publiées à moins de 10 % de leur valeur estimée. */
  fairPriceListings: number;
  /** Ancienneté du compte, en jours. */
  accountAgeDays: number;
  /** Nombre d'annonces publiées (tous statuts). */
  listings: number;
  /** Au moins une annonce complète. */
  hasNeatListing: boolean;
  /** Au moins une annonce à 75+ de proximité méta (score fiable). */
  hasMetaListing: boolean;
  /** Archétypes différents parmi ses annonces. */
  distinctArchetypes: number;
  /** Profil complet (photo, pseudo, lieu d'expédition). */
  profileComplete: boolean;
};

export type EarnedBadge = { key: string; level: number };

/** Niveau atteint pour une valeur (0 : pas encore). */
export function levelFor(def: BadgeDef, value: number | null): number {
  if (value == null || !def.levels) return 0;
  let level = 0;
  def.levels.forEach((t, i) => {
    if (def.lowerIsBetter ? value <= t : value >= t) level = i + 1;
  });
  return level;
}

/** Valeur mesurée pour chaque badge à niveaux. */
function valueOf(key: string, s: BadgeStats): number | null {
  switch (key) {
    case "reactive":
      return s.medianReplyHours;
    case "fair-price":
      return s.fairPriceListings;
    case "veteran":
      return s.listings > 0 ? s.accountAgeDays : null;
    case "collector":
      return s.distinctArchetypes;
    default:
      return null;
  }
}

/** Badges obtenus (avec leur niveau ; 1 pour un badge à niveau unique). */
export function computeBadges(s: BadgeStats): EarnedBadge[] {
  const out: EarnedBadge[] = [];
  for (const def of BADGES) {
    let level = 0;
    if (def.levels) level = levelFor(def, valueOf(def.key, s));
    else if (def.key === "neat-listing") level = s.hasNeatListing ? 1 : 0;
    else if (def.key === "meta-list") level = s.hasMetaListing ? 1 : 0;
    else if (def.key === "first-steps") level = s.profileComplete ? 1 : 0;
    else if (def.key === "estimator") level = s.listings > 0 ? 1 : 0;
    if (level > 0) out.push({ key: def.key, level });
  }
  return out;
}

/** Prochain palier d'un badge à niveaux : « encore 2 annonces pour Juste prix II ». Null si au maximum ou sans niveaux. */
export function nextStep(def: BadgeDef, s: BadgeStats): { level: number; remaining: number | null } | null {
  if (!def.levels) return null;
  const value = valueOf(def.key, s);
  const current = levelFor(def, value);
  if (current >= 3) return null;
  const target = def.levels[current];
  if (value == null) return { level: current + 1, remaining: null };
  const remaining = def.lowerIsBetter ? null : Math.max(0, Math.ceil(target - value));
  return { level: current + 1, remaining };
}

/** Changements à enregistrer : nouveaux badges et niveaux gagnés (on ne retire jamais un badge obtenu). */
export function badgeChanges(previous: EarnedBadge[], next: EarnedBadge[]): EarnedBadge[] {
  const before = new Map(previous.map((b) => [b.key, b.level]));
  return next.filter((b) => b.level > (before.get(b.key) ?? 0));
}

/** Badges utiles à la décision d'achat (confiance) : seuls affichés à côté d'une annonce. Les autres restent sur le profil. */
export function isTransactionBadge(b: EarnedBadge): boolean {
  return BADGE_BY_KEY.get(b.key)?.family === "trust";
}

export const ROMAN = ["", "I", "II", "III"] as const;

/** Les badges les plus forts à montrer à côté d'un vendeur : confiance d'abord, puis niveau. */
export function topBadges(earned: EarnedBadge[], max: number): EarnedBadge[] {
  const order: Record<BadgeFamily, number> = { trust: 0, quality: 1, journey: 2 };
  return [...earned]
    .filter((b) => BADGE_BY_KEY.has(b.key))
    .sort((a, b) => order[BADGE_BY_KEY.get(a.key)!.family] - order[BADGE_BY_KEY.get(b.key)!.family] || b.level - a.level)
    .slice(0, max);
}
