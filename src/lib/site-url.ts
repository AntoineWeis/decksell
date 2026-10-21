/**
 * Adresse publique du site, pour les liens absolus (sitemap, aperçus de partage).
 * NEXT_PUBLIC_SITE_URL si elle est définie (ex. futur domaine), sinon l'adresse de
 * production fournie par Vercel, sinon le serveur local.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
