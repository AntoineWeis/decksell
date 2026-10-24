// Symbole du logo decksell : une fiole de mana inclinée, bouchée, avec deux étincelles,
// en dégradé bleu → violet. Défini une seule fois : l'en-tête (LogoMark) et les images de
// partage (data URL) le partagent.

export const LOGO_COLORS = { from: "#5a90ff", to: "#9d84ff" } as const;

/** Inclinaison de la fiole autour du centre de sa panse (repère 32 × 32). */
export const FLASK_TILT = "rotate(42 14.5 19.5)";
/** Contour de la panse, ouvert en haut pour le goulot. */
export const FLASK_BODY = "M12 11.1A9.6 9.6 0 1 0 17 11.1";
/** Goulot et son rebord. */
export const FLASK_NECK = "M12 11.2V7.4h5v3.8";
export const FLASK_RIM = "M10.9 7.4h7.2";
/** Bouchon. */
export const FLASK_CORK = "M12.5 6.2V3.4c0-1 .9-1.6 2-1.6s2 .6 2 1.6v2.8Z";
/** Liquide, découpé dans la panse : une vague qui remonte sur la gauche. */
export const FLASK_LIQUID = "M4 22.6c2.4-.6 4.2-6.8 5.2-7.2 1-.4 1.2.6 1.2 1.6 0 2.8 1.2 4.4 3.4 4.6 2.2.2 3.8-1.6 6.8-1.6 2.4 0 4.4 1.4 5.2 3.2V31H4Z";
export const FLASK_LIQUID_CLIP = { cx: 14.5, cy: 19.5, r: 7.2 } as const;
/** Étincelles : une grande en haut à gauche, une petite en bas à droite. */
export const SPARKLE_BIG = "M5 1.4l.95 3.75 3.55.95-3.55.95L5 10.8l-.95-3.75L.5 6.1l3.55-.95Z";
export const SPARKLE_SMALL = "M28.2 23.2l.62 2.48 2.38.62-2.38.62-.62 2.48-.62-2.48-2.38-.62 2.38-.62Z";

/** Le symbole en SVG autonome (pour les images générées, où le JSX SVG est limité). */
export function logoSvg(size = 32): string {
  const c = FLASK_LIQUID_CLIP;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${LOGO_COLORS.from}"/><stop offset="1" stop-color="${LOGO_COLORS.to}"/></linearGradient><clipPath id="c"><circle cx="${c.cx}" cy="${c.cy}" r="${c.r}"/></clipPath></defs><g transform="${FLASK_TILT}"><g fill="none" stroke="url(#g)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${FLASK_BODY}"/><path d="${FLASK_NECK}"/><path d="${FLASK_RIM}"/></g><path d="${FLASK_CORK}" fill="url(#g)"/></g><path d="${FLASK_LIQUID}" fill="url(#g)" clip-path="url(#c)"/><path d="${SPARKLE_BIG}" fill="url(#g)"/><path d="${SPARKLE_SMALL}" fill="${LOGO_COLORS.to}"/></svg>`;
}

/** Même chose en data URL, pour une balise <img>. */
export function logoDataUrl(size = 32): string {
  return `data:image/svg+xml;base64,${Buffer.from(logoSvg(size)).toString("base64")}`;
}
