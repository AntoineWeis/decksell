import type { Metadata } from "next";
import { Estimator } from "@/components/estimator";
import { getArchetypes } from "@/lib/archetypes";

export const metadata: Metadata = {
  title: "Estimer la valeur d'un deck Magic Modern ou Commander",
  description:
    "Colle ta decklist Modern ou Commander (MTGO, Arena, Moxfield, Archidekt) et obtiens sa valeur carte par carte d'après les prix Cardmarket en euros. Gratuit, sans compte.",
  alternates: { canonical: "/estimer" },
};

export default async function EstimatePage() {
  const archetypes = await getArchetypes();
  return (
    <main className="flex-1">
      <Estimator archetypes={archetypes} />
    </main>
  );
}
