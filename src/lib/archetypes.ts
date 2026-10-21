import "server-only";
import { cacheLife } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Archetype } from "./listings.ts";

/**
 * Liste fixe des archétypes Modern (table archetypes, lisible publiquement).
 * Elle change rarement : mise en cache une heure.
 */
export async function getArchetypes(): Promise<Archetype[]> {
  "use cache";
  cacheLife("hours");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data, error } = await supabase.from("archetypes").select("id, slug, name").order("name");
  if (error) {
    console.error("Lecture des archétypes impossible :", error.message);
    return [];
  }
  return (data ?? []) as Archetype[];
}
