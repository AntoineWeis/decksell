import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { GATE_COOKIE, GATE_PATH, gatePassword, gateToken, isGateExempt } from "@/lib/site-gate";

// 1. Verrou « Bientôt » : sans le bon cookie, toute page renvoie vers /bientot (voir lib/site-gate.ts).
// 2. Rafraîchit la session Supabase (cookies) avant chaque page.
// Ce n'est pas une protection : chaque page et action revérifie le membre côté serveur.
export async function proxy(request: NextRequest) {
  const password = gatePassword();
  if (password) {
    const { pathname, search } = request.nextUrl;
    const unlocked = request.cookies.get(GATE_COOKIE)?.value === (await gateToken(password));
    if (!unlocked && !isGateExempt(pathname)) {
      const url = new URL(GATE_PATH, request.url);
      if (pathname !== "/") url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    if (unlocked && pathname === GATE_PATH) return NextResponse.redirect(new URL("/", request.url));
  } else if (request.nextUrl.pathname === GATE_PATH) {
    // Site ouvert : la page d'attente n'existe plus. Redirection permanente, pour que les moteurs
    // de recherche oublient cette adresse (marquée « noindex ») au profit de l'accueil.
    return NextResponse.redirect(new URL("/", request.url), 308);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
        },
      },
    },
  );

  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
