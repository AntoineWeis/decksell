import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Client Supabase « au nom du membre connecté » : clé publishable + session en cookies.
// Les règles RLS s'appliquent : un membre ne lit et n'écrit que ses propres données.
// Un nouveau client par requête (ne jamais le partager entre requêtes).
export async function createSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Variables Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Appelé depuis un Server Component : écriture impossible, le proxy rafraîchit la session.
        }
      },
    },
  });
}
