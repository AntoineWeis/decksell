import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "./supabase-server.ts";

// Limite de requêtes par visiteur sur les actions ouvertes à tous (estimateur, niveau de puissance, import).
// Le visiteur est reconnu par une empreinte de son adresse IP (hachée, jamais enregistrée en clair).
// Compteur en base (schema.sql, section 29), partagé par toutes les instances du serveur ;
// sans la section 29, repli sur un compteur en mémoire, propre à chaque instance.

export type Limit = { name: string; max: number; windowSeconds: number };

export const LIMITS = {
  estimate: [
    { name: "estimate-min", max: 15, windowSeconds: 60 },
    { name: "estimate-hour", max: 150, windowSeconds: 3600 },
  ],
  bracket: [
    { name: "bracket-min", max: 20, windowSeconds: 60 },
    { name: "bracket-hour", max: 200, windowSeconds: 3600 },
  ],
  import: [
    { name: "import-min", max: 10, windowSeconds: 60 },
    { name: "import-hour", max: 60, windowSeconds: 3600 },
  ],
} satisfies Record<string, Limit[]>;

export const RATE_LIMIT_MESSAGE = "Trop de demandes d'affilée. Patiente une minute, puis réessaie.";

async function visitor(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-vercel-forwarded-for") ?? "inconnu";
  const salt = process.env.SUPABASE_SECRET_KEY ?? "decksell";
  return createHash("sha256").update(`${salt}:${ip}`).digest("base64url").slice(0, 22);
}

const memory = new Map<string, number>();
let dbReady = true;

function hitMemory(key: string, max: number): boolean {
  if (memory.size > 10_000) memory.clear();
  const n = (memory.get(key) ?? 0) + 1;
  memory.set(key, n);
  return n <= max;
}

/** Vrai si le visiteur reste sous toutes les limites données (chaque appel compte un passage). */
export async function underLimit(limits: Limit[]): Promise<boolean> {
  const who = await visitor();
  const results = await Promise.all(
    limits.map(async ({ name, max, windowSeconds }) => {
      const key = `${name}:${who}`;
      if (dbReady) {
        const { data, error } = await getSupabaseAdmin().rpc("hit_rate_limit", {
          p_key: key,
          p_max: max,
          p_window_seconds: windowSeconds,
        });
        if (!error) return data !== false;
        if (error.code === "PGRST202" || /hit_rate_limit/.test(error.message)) {
          dbReady = false;
          console.warn("Limite de requêtes : section 29 de schema.sql absente, compteur en mémoire en attendant.");
        } else {
          console.error("Limite de requêtes indisponible :", error.message);
          return true; // la base flanche : on ne bloque pas les visiteurs pour autant
        }
      }
      const windowStart = Math.floor(Date.now() / 1000 / windowSeconds);
      return hitMemory(`${key}:${windowStart}`, max);
    }),
  );
  return results.every(Boolean);
}
