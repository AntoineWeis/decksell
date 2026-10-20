import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { SignupForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignupPage() {
  return (
    <AuthCard title="Créer un compte" subtitle="Gratuit. Pour mettre tes decks en vente et suivre tes ventes.">
      <SignupForm />
    </AuthCard>
  );
}
