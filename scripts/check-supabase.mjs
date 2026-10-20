// Test de connexion Supabase. Lancer : npm run check:supabase
// Affiche uniquement le résultat, jamais les clés.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("ECHEC : variable manquante dans .env.local");
  console.error("  NEXT_PUBLIC_SUPABASE_URL :", url ? "ok" : "MANQUANTE");
  console.error("  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY :", key ? "ok" : "MANQUANTE");
  process.exit(1);
}

try {
  const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
    headers: { apikey: key },
  });
  if (res.ok) {
    console.log("OK : connecté à Supabase (HTTP", res.status + ")");
  } else if (res.status === 401 || res.status === 403) {
    console.error("ECHEC : clé refusée (HTTP", res.status + "). Vérifie la clé publishable.");
    process.exit(1);
  } else {
    console.error("ECHEC : réponse inattendue (HTTP", res.status + ").");
    process.exit(1);
  }
} catch (e) {
  console.error("ECHEC : serveur injoignable. Vérifie l'URL.", e.cause?.code ?? e.message);
  process.exit(1);
}
