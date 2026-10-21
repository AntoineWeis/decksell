import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { safeNext } from "@/lib/auth";

// Lien de confirmation d'inscription reçu par email : ouvre la session puis renvoie vers la page prévue.
// (Les liens de mot de passe passent par /auth/confirm.)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  // Lien de mot de passe expiré, déjà utilisé ou ouvert dans un autre navigateur : on en redemande un.
  if (next.startsWith("/nouveau-mot-de-passe")) {
    return NextResponse.redirect(new URL("/mot-de-passe-oublie?expired=1", origin));
  }
  // Lien ouvert sur un autre appareil ou expiré : l'email est confirmé, il suffit de se connecter.
  return NextResponse.redirect(new URL(`/connexion?confirmed=1&next=${encodeURIComponent(next)}`, origin));
}
