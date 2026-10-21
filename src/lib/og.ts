import "server-only";

// Outils des images d'aperçu de partage (next/og).

const UA = { "User-Agent": "decksell/0.1 (apercu de partage)" };

const fontCache = new Map<number, Promise<ArrayBuffer | null>>();

/** Police Sora (titres du site) dans cette graisse, au format TrueType lu par next/og. Null si indisponible. */
function loadSora(weight: 400 | 700): Promise<ArrayBuffer | null> {
  let font = fontCache.get(weight);
  if (font) return font;
  font = (async () => {
    try {
      // Sans navigateur moderne déclaré, Google Fonts renvoie un fichier TrueType.
      const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Sora:wght@${weight}`)).text();
      const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
      if (!url) return null;
      const res = await fetch(url);
      return res.ok ? await res.arrayBuffer() : null;
    } catch {
      return null;
    }
  })();
  fontCache.set(weight, font);
  return font;
}

/** Polices pour ImageResponse : Sora normale et grasse, ou la police par défaut si le chargement échoue. */
export async function ogFonts() {
  const [regular, bold] = await Promise.all([loadSora(400), loadSora(700)]);
  if (!regular || !bold) return undefined;
  return [
    { name: "Sora", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Sora", data: bold, weight: 700 as const, style: "normal" as const },
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
