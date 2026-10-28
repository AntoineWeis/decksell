import { ImageResponse } from "next/og";
import { fetchPublicListing } from "@/lib/public-listings";
import { artCrop, CONDITIONS } from "@/lib/listings";
import { formatEur } from "@/lib/pricing";
import { imageDataUrl, ogFonts } from "@/lib/og";
import { OgLogo } from "@/components/og-logo";
import { BRAND } from "@/lib/brand-colors";

// Aperçu de partage d'un deck : illustration de sa carte phare, nom, prix et valeur estimée.
export const alt = "Deck Magic en vente sur decksell";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await fetchPublicListing(id).catch(() => null);
  const [art, fonts] = await Promise.all([imageDataUrl(artCrop(listing?.cover_image_url ?? null)), ogFonts()]);
  const display = fonts ? "Sora" : undefined;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0f1830", color: "#f4f7ff" }}>
        {/* Illustration sur la moitié droite, fondue vers le texte à gauche */}
        {art && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={art}
            alt=""
            width={700}
            height={630}
            style={{ position: "absolute", top: 0, left: 500, width: 700, height: 630, objectFit: "cover" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 500,
            width: 700,
            height: 630,
            display: "flex",
            background: "linear-gradient(90deg, #0f1830 0%, rgba(15,24,48,0.55) 45%, rgba(15,24,48,0) 100%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, width: "100%", fontFamily: display }}>
          <OgLogo />

          {listing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
              <div style={{ fontSize: 28, color: BRAND.bannerMist, fontWeight: 400 }}>
                {`Deck ${listing.format === "commander" ? "Commander" : "Modern"}${listing.archetype ? ` · ${listing.archetype.name}` : ""}`}
              </div>
              <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, fontFamily: display }}>{listing.title.slice(0, 60)}</div>
              <div style={{ fontSize: 60, fontWeight: 700, marginTop: 8, fontFamily: display }}>{formatEur(listing.asking_cents)}</div>
              <div style={{ fontSize: 26, color: BRAND.bannerMist, fontWeight: 400 }}>
                {`Valeur estimée ${formatEur(listing.estimated_cents)} · ${listing.card_count} cartes · ${CONDITIONS[listing.condition]}`}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 64, fontWeight: 700, fontFamily: display }}>Decks Magic en vente</div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
