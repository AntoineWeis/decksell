// Couleurs de la marque en valeurs fixes, pour ce qui ne lit pas le CSS du site : images de
// partage et icônes générées (ImageResponse), dégradé du logo, étincelles des badges.
// Les mêmes teintes sont décrites dans DESIGN.md (palette) ; dans le CSS, préférer les jetons
// du thème (bg-banner, text-mana-violet…).

export const BRAND = {
  /** Nuit du bandeau et de la barre. */
  banner: "#0f1830",
  /** Bleu nuit plus clair et lueur bleue : dégradé de fond des images de partage. */
  bannerDeep: "#16244a",
  bannerGlow: "#1d3a8a",
  /** Texte secondaire sur fond nuit, dans les images de partage. */
  bannerMist: "#aab6d6",
  /** « sell » du logo. */
  logoBlue: "#5a90ff",
  /** Dégradé « mana » (logo, médailles, étincelles des badges). */
  manaBlue: "#7fb2ff",
  manaViolet: "#9d84ff",
} as const;
