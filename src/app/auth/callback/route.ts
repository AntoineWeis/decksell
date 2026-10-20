import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { safeNext } from "@/lib/auth";

// Lien de confirmation reçu par email : ouvre la session puis renvoie vers l'espace membre.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  // Lien ouvert sur un autre appareil ou expiré : l'email est confirmé, il suffit de se connecter.
  return NextResponse.redirect(new URL(`/connexion?confirmed=1&next=${encodeURIComponent(next)}`, origin));
}
