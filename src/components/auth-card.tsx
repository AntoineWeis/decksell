import { Suspense } from "react";

/** Cadre commun des pages connexion et inscription. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mb-6 mt-1 text-muted">{subtitle}</p>
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          {/* Le formulaire lit l'adresse (?next=…) : chargé à part */}
          <Suspense fallback={<div className="h-64" />}>{children}</Suspense>
        </div>
      </div>
    </main>
  );
}
