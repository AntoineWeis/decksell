import "server-only";
import { cookies } from "next/headers";
import { FLASH_COOKIE, type Flash } from "./flash-shared.ts";

/**
 * Prépare une notification à afficher sur la page suivante, avant un redirect() dans
 * une action serveur. Cookie lisible par le navigateur (il l'efface après affichage),
 * valable 30 secondes.
 */
export async function setFlash(kind: Flash["kind"], message: string): Promise<void> {
  // Next.js encode lui-même la valeur du cookie : pas d'encodage en plus ici.
  (await cookies()).set(FLASH_COOKIE, JSON.stringify({ kind, message }), {
    path: "/",
    maxAge: 30,
    sameSite: "lax",
    httpOnly: false,
  });
}
