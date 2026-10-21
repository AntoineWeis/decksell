import type { Metadata } from "next";
import { Estimator } from "@/components/estimator";

export const metadata: Metadata = {
  title: "Estimer un deck",
  description: "Colle ta decklist Modern et obtiens sa valeur carte par carte, d'après les prix Cardmarket en euros.",
};

export default function EstimatePage() {
  return (
    <main className="flex-1">
      <Estimator />
    </main>
  );
}
