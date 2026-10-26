import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { SignupForm } from "@/components/auth-forms";

export const metadata: Metadata = {
  title: "Créer un compte",
  description: "Crée ton compte decksell gratuitement pour mettre tes decks Magic Modern en vente et échanger avec les acheteurs.",
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return (
    <AuthCard title="Créer un compte" subtitle="Gratuit. Pour mettre tes decks en vente et suivre tes ventes.">
      <SignupForm />
    </AuthCard>
  );
}
