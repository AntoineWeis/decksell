// Verrou « Bientôt » : tant que SITE_PASSWORD est défini, le site n'est visible qu'avec le mot de passe.
// Sans cette variable, le verrou est coupé et le site est public.
// Le cookie contient une empreinte du mot de passe (jamais le mot de passe lui-même) :
// changer SITE_PASSWORD déconnecte donc tous ceux qui avaient l'ancien.

export const GATE_COOKIE = "decksell_preview";
export const GATE_PATH = "/bientot";
export const GATE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export function gatePassword(): string | null {
  return process.env.SITE_PASSWORD || null;
}

/** Empreinte SHA-256 du mot de passe, en hexadécimal. Marche dans le proxy comme dans une action. */
export async function gateToken(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`decksell-gate:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Adresses visibles sans mot de passe : la page elle-même et ce que le navigateur charge seul. */
export function isGateExempt(pathname: string): boolean {
  return (
    pathname === GATE_PATH ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon")
  );
}
