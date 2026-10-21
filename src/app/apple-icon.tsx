import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og";

// Icône d'écran d'accueil (iPhone, iPad) : « ds » aux couleurs du logo sur bleu nuit.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const font = await loadGoogleFont("Rajdhani", 700);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f1830",
          color: "#f3f6fc",
          fontSize: 140,
          fontWeight: 700,
          fontFamily: font ? "Rajdhani" : undefined,
          paddingBottom: 10,
        }}
      >
        d<span style={{ color: "#5a90ff" }}>s</span>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Rajdhani", data: font, weight: 700, style: "normal" }] : undefined },
  );
}
