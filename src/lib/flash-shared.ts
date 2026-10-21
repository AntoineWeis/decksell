// Notification « flash » transmise d'une action serveur à la page suivante, par cookie.
// Partagé entre le serveur (écriture) et le navigateur (lecture).

export const FLASH_COOKIE = "decksell_flash";

export type Flash = { kind: "success" | "error"; message: string };

/** Valeur brute du cookie flash dans la chaîne document.cookie, ou null. */
export function rawFlash(cookieHeader: string): string | null {
  return (
    cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${FLASH_COOKIE}=`))
      ?.slice(FLASH_COOKIE.length + 1) || null
  );
}

/** Lit le cookie flash ; null s'il est absent ou illisible. */
export function readFlash(cookieHeader: string): Flash | null {
  let raw = rawFlash(cookieHeader);
  // Décode jusqu'à obtenir du JSON lisible (le cookie peut être encodé une ou deux fois).
  for (let i = 0; raw && i < 3; i++) {
    try {
      raw = decodeURIComponent(raw);
    } catch {
      return null;
    }
    try {
      const value = JSON.parse(raw);
      if ((value?.kind === "success" || value?.kind === "error") && typeof value.message === "string") {
        return { kind: value.kind, message: value.message.slice(0, 200) };
      }
      return null;
    } catch {
      // pas encore lisible : on décode une fois de plus
    }
  }
  return null;
}
