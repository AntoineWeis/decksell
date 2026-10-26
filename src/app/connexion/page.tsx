import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connecte-toi à decksell pour gérer tes annonces de decks Magic, tes messages et tes favoris.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <AuthCard title="Connexion" subtitle="Retrouve tes annonces et ton profil.">
      <LoginForm />
    </AuthCard>
  );
}
