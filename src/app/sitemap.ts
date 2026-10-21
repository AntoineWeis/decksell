import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { fetchPublicListings } from "@/lib/public-listings";
import { siteUrl } from "@/lib/site-url";

// Pages publiques du site, plus chaque deck en vente et chaque vendeur qui en a un.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/decks`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/estimer`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/qui-sommes-nous`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/conditions-utilisation`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Hors du try : ce signal de Next (lecture au moment de la requête) ne doit pas être intercepté.
  await connection();
  let listings: Awaited<ReturnType<typeof fetchPublicListings>> = [];
  try {
    listings = await fetchPublicListings();
  } catch (e) {
    // Base indisponible : on renvoie au moins les pages fixes.
    console.error(e);
  }

  const sellers = new Map<string, string>();
  for (const l of listings) {
    if (l.seller && (!sellers.has(l.seller.id) || l.created_at > sellers.get(l.seller.id)!)) {
      sellers.set(l.seller.id, l.created_at);
    }
  }

  return [
    ...pages,
    ...listings.map((l) => ({
      url: `${base}/decks/${l.id}`,
      lastModified: l.created_at,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...[...sellers].map(([id, last]) => ({
      url: `${base}/vendeurs/${id}`,
      lastModified: last,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
