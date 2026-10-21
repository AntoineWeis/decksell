import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og";

// Icône d'onglet : le « d » du logo, en Rajdhani, bleu sur bleu nuit.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
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
          borderRadius: 14,
          color: "#5a90ff",
          fontSize: 58,
          fontWeight: 700,
          fontFamily: font ? "Rajdhani" : undefined,
          paddingBottom: 4,
        }}
      >
        d
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Rajdhani", data: font, weight: 700, style: "normal" }] : undefined },
  );
}
