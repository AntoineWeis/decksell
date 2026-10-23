import { NextResponse, type NextRequest } from "next/server";
import { suggestCards } from "@/lib/card-names";

// Suggestions de noms de cartes pour la recherche de l'index (anglais et français).
// GET /api/cartes?q=foudre → [{ name: "Lightning Bolt", french: "Foudre" }, …]
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  const suggestions = q.length >= 3 ? await suggestCards(q) : [];
  return NextResponse.json(suggestions, { headers: { "Cache-Control": "public, max-age=3600" } });
}
