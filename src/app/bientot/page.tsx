import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { LogoMark } from "@/components/logo-mark";
import { ManaRise } from "@/components/mana-rise";
import { GateForm } from "./gate-form";
// Même illustration que le bandeau d'accueil : marais brumeux de Kamigawa, © Wizards of the Coast.
import heroArt from "../../../public/hero-swamp.webp";

export const metadata: Metadata = {
  title: "Bientôt en ligne",
  robots: { index: false, follow: false },
};

/** Page d'attente : plein écran par-dessus la barre et le pied de page du site. */
export default function ComingSoonPage() {
  return (
    <main className="fixed inset-0 z-40 overflow-y-auto bg-banner text-banner-ink">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <Image
          src={heroArt}
          alt=""
          fill
          preload
          placeholder="blur"
          sizes="100vw"
          className="object-cover object-[60%_45%] opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-banner/95 via-banner/75 to-banner/30" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-banner to-transparent" />
        <ManaRise className="absolute inset-0 h-full w-full" />
      </div>

      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <p className="flex items-center gap-2 font-logo text-[27px] font-bold leading-none">
          <LogoMark size={28} />
          <span>
            deck<span className="text-[#5a90ff]">sell</span>
          </span>
        </p>

        <div className="flex flex-1 flex-col justify-center py-16">
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-semibold tracking-wide text-banner-muted uppercase backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-[#5a90ff]" />
            Bientôt en ligne
          </p>
          <h1 className="max-w-2xl font-display text-4xl leading-[1.1] font-semibold tracking-[-0.02em] sm:text-6xl">
            Achète et vends des decks Modern au juste prix.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-banner-muted">
            Estime ton deck carte par carte d’après les prix Cardmarket, mets-le en vente ou trouve un deck complet
            entre joueurs. On peaufine les derniers détails.
          </p>

          <div className="mt-10">
            <Suspense fallback={<div className="h-[88px]" />}>
              <GateForm />
            </Suspense>
          </div>
        </div>

        <p className="text-xs text-banner-muted/80">Magic : The Gathering est une marque de Wizards of the Coast. decksell n’y est pas affilié.</p>
      </div>
    </main>
  );
}
