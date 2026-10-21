import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { NewPasswordForm } from "@/components/auth-forms";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default function NewPasswordPage() {
  return (
    <AuthCard title="Nouveau mot de passe" subtitle="Choisis le mot de passe de ton compte.">
      <NewPasswordGate />
    </AuthCard>
  );
}

/** On arrive ici connecté, par le lien reçu par email ou depuis son profil. */
async function NewPasswordGate() {
  const user = await getUser();
  if (!user) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">
          Ce lien a expiré ou a déjà servi. Demande un nouveau lien pour choisir ton mot de passe.
        </p>
        <Link
          href="/mot-de-passe-oublie"
          className="flex h-11 w-full items-center justify-center rounded-xl bg-accent font-semibold text-on-accent transition hover:brightness-110"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }
  return <NewPasswordForm email={user.email} />;
}
