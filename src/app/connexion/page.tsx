import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <AuthCard title="Connexion" subtitle="Retrouve tes annonces et ton profil.">
      <LoginForm />
    </AuthCard>
  );
}
