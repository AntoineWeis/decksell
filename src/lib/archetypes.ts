import "server-only";
import { cacheLife } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Archetype } from "./listings.ts";

/**
 * Liste fixe des archétypes, Modern et Commander (table archetypes, lisible publiquement).
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
  const { data, error } = await supabase.from("archetypes").select("id, slug, name, format").order("name");
  if (error) {
    console.error("Lecture des archétypes impossible :", error.message);
    return [];
  }
  return (data ?? []) as Archetype[];
}

/** L'archétype existe-t-il pour ce format ? (null : aucun archétype, toujours accepté) */
export async function archetypeMatchesFormat(id: number | null, format: string): Promise<boolean> {
  if (id == null) return true;
  const found = (await getArchetypes()).find((a) => a.id === id);
  return !!found && (found.format ?? "modern") === format;
}
