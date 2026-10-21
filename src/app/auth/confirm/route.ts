import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { safeNext } from "@/lib/auth";

// Lien reçu par email pour choisir un nouveau mot de passe. Deux formats acceptés :
// - « token_hash » (modèle d'email personnalisé) : fonctionne dans n'importe quel navigateur ;
// - « code » (modèle par défaut) : fonctionne seulement dans le navigateur de la demande.
const TYPES: EmailOtpType[] = ["recovery", "signup", "email", "email_change", "invite", "magiclink"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"), type === "recovery" ? "/nouveau-mot-de-passe" : "/espace");

  const code = searchParams.get("code");
  const supabase = await createSupabaseServer();

  if (tokenHash && type && TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  if (type === "recovery" || next.startsWith("/nouveau-mot-de-passe")) return NextResponse.redirect(new URL("/mot-de-passe-oublie?expired=1", origin));
  return NextResponse.redirect(new URL(`/connexion?confirmed=1&next=${encodeURIComponent(next)}`, origin));
}
