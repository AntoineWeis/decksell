import "server-only";
import { createClient } from "@supabase/supabase-js";

// Client Supabase avec la clé secrète : UNIQUEMENT côté serveur.
// "server-only" fait échouer le build si ce fichier est importé côté navigateur.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Variables Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY.");
  }

  return createClient(url, secretKey, { auth: { persistSession: false } });
}
