import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og";
import { OgLogo } from "@/components/og-logo";

// Aperçu de partage par défaut (Discord, réseaux sociaux) pour toutes les pages du site.
export const alt = "decksell : estime et vends ton deck Magic Modern au juste prix";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fonts = await ogFonts();
  const display = fonts ? "Sora" : undefined;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0f1830 0%, #16244a 60%, #1d3a8a 100%)",
          color: "#f4f7ff",
        }}
      >
        <OgLogo size={64} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, maxWidth: 950, fontFamily: display }}>
            Des decks Modern complets, au juste prix
          </div>
          <div style={{ fontSize: 34, color: "#aab6d6", maxWidth: 950, fontFamily: display, fontWeight: 400 }}>
            Estimation carte par carte d&apos;après les prix Cardmarket, puis vente entre joueurs.
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
