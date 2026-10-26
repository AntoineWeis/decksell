import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { ForgotPasswordForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false, follow: true } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Mot de passe oublié" subtitle="Indique ton email, on t'envoie un lien pour en choisir un nouveau.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
