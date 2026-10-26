import type { Metadata } from "next";
import { Geist, Geist_Mono, Rajdhani, Sora } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteUrl } from "@/lib/site-url";
import { Suspense } from "react";
import { FlashToasts, ToastProvider } from "@/components/toaster";
import { BadgeUnlock } from "@/components/badge-unlock";
import { getUser } from "@/lib/auth";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Police des grands titres.
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

// Police du logo (le mot « decksell » dans la barre de navigation).
const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: "700",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  openGraph: { siteName: "decksell", locale: "fr_FR", type: "website" },
  title: { default: "decksell · Achète et vends des decks Modern au juste prix", template: "%s · decksell" },
  description:
    "Estime ton deck Magic : The Gathering carte par carte d’après les prix Cardmarket, mets-le en vente ou trouve un deck Modern complet entre joueurs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} ${rajdhani.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
          {/* Lit l'adresse courante : à part, pour ne pas bloquer le rendu statique. */}
          <Suspense fallback={null}>
            <FlashToasts />
          </Suspense>
          {/* Animation de déblocage des badges : seulement pour un membre connecté (aucun appel sinon). */}
          <Suspense fallback={null}>
            <BadgeUnlockSlot />
          </Suspense>
        </ToastProvider>
        {/* Mesure d'audience Vercel : sans cookie, pages vues anonymisées (voir /confidentialite).
            Variante « react » et non « next » : celle-ci lit l'adresse dans un bloc qui ne se résout
            jamais avec le rendu partiel (cacheComponents), et aucune page vue ne partait en production. */}
        <Analytics />
      </body>
    </html>
  );
}

async function BadgeUnlockSlot() {
  return (await getUser()) ? <BadgeUnlock /> : null;
}
