import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Pages privées ou sans intérêt pour les moteurs de recherche.
      disallow: ["/espace", "/auth/", "/api/", "/nouveau-mot-de-passe", "/compte-supprime"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
