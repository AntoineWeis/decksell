import { logoDataUrl } from "@/lib/logo";

/** Logo des images de partage (next/og) : fiole de mana et « decksell », comme l'en-tête du site. */
export function OgLogo({ size = 56 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.28 }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- image générée, pas de next/image ici */}
      <img src={logoDataUrl(size)} alt="" width={size} height={size} />
      <div style={{ display: "flex", fontSize: size * 0.95, fontWeight: 700, fontFamily: "Rajdhani", letterSpacing: -0.5 }}>
        deck<span style={{ color: "#5a90ff" }}>sell</span>
      </div>
    </div>
  );
}
