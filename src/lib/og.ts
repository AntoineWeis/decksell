import "server-only";

// Outils des images d'aperçu de partage (next/og).

const UA = { "User-Agent": "decksell/0.1 (apercu de partage)" };

const fontCache = new Map<string, Promise<ArrayBuffer | null>>();

/** Police Google dans cette graisse, au format TrueType lu par next/og. Null si indisponible. */
export function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}`;
  let font = fontCache.get(key);
  if (font) return font;
  font = (async () => {
    try {
      // Sans navigateur moderne déclaré, Google Fonts renvoie un fichier TrueType.
      const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`)).text();
      const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
      if (!url) return null;
      const res = await fetch(url);
      return res.ok ? await res.arrayBuffer() : null;
    } catch {
      return null;
    }
  })();
  fontCache.set(key, font);
  return font;
}

/** Polices pour ImageResponse : Sora normale et grasse, ou la police par défaut si le chargement échoue. */
export async function ogFonts() {
  const [regular, bold, logo] = await Promise.all([
    loadGoogleFont("Sora", 400),
    loadGoogleFont("Sora", 700),
    loadGoogleFont("Rajdhani", 700),
  ]);
  if (!regular || !bold) return undefined;
  return [
    { name: "Sora", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Sora", data: bold, weight: 700 as const, style: "normal" as const },
    ...(logo ? [{ name: "Rajdhani", data: logo, weight: 700 as const, style: "normal" as const }] : []),
  ];
}

/** Télécharge une image et la renvoie en data URL (plus fiable qu'une adresse distante). */
export async function imageDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    return `data:${type};base64,${base64}`;
  } catch {
    return null;
  }
}
