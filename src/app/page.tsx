import Image from "next/image";
import Link from "next/link";
import { Estimator } from "@/components/estimator";

// Illustration d'en-tête, servie par Scryfall (art crop). L'artiste est crédité sous l'image.
const HERO_ART = {
  url: "https://cards.scryfall.io/art_crop/front/8/d/8d74a469-c71d-4773-99d3-5456b31df424.jpg?1783937526",
  card: "Emrakul, the Promised End",
  artist: "Jaime Jones",
};

const FEATURES = [
  {
    title: "Estimation instantanée",
    text: "Colle ta liste depuis MTGO, Arena, Moxfield ou MTGGoldfish : le total tombe en quelques secondes.",
    icon: (
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" strokeLinejoin="round" />
    ),
  },
  {
    title: "Détail carte par carte",
    text: "Chaque carte au prix de son impression la moins chère sur Cardmarket. Tu vois où est la valeur.",
    icon: (
      <>
        <rect x="4" y="3" width="12" height="16" rx="2" />
        <path d="M8 21h10a2 2 0 0 0 2-2V7" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Mise en vente et suivi",
    text: "Crée ton compte, mets ton deck en vente au prix de ton choix et suis tes ventes depuis ton espace.",
    icon: (
      <>
        <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" strokeLinejoin="round" />
        <circle cx="8" cy="8" r="1.5" />
      </>
    ),
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-line">
        {/* Illustration de fond (Scryfall), estompée vers la gauche pour garder le texte lisible */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src={HERO_ART.url}
            alt=""
            fill
            preload
            unoptimized
            sizes="100vw"
            className="object-cover object-[60%_35%] opacity-30 [mask-image:linear-gradient(to_right,transparent_5%,black_60%)] dark:opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/10" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--accent-soft),transparent_60%)] opacity-70" />
        </div>
        <p className="absolute bottom-2 right-4 z-10 text-[10px] text-muted/80 sm:right-6">
          Illustration : {HERO_ART.card}, par {HERO_ART.artist}
        </p>

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
            <span className="size-1.5 rounded-full bg-ok" />
            Format Modern · prix Cardmarket
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Combien vaut ton deck ? <span className="text-accent">Vends-le au juste prix.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            decksell calcule la valeur de ta decklist Magic carte par carte, d&apos;après les prix Cardmarket. Ensuite,
            mets ton deck en vente et suis tes ventes au même endroit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#estimer"
              className="inline-flex h-11 items-center rounded-xl bg-accent px-5 font-semibold text-on-accent transition hover:brightness-110"
            >
              Estimer mon deck
            </a>
            <Link
              href="/inscription"
              className="inline-flex h-11 items-center rounded-xl border border-line bg-surface px-5 font-semibold transition hover:bg-sunken"
            >
              Créer un compte vendeur
            </Link>
          </div>

          <ul className="mt-14 grid gap-4 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-2xl border border-line bg-surface p-5">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="size-6 text-accent"
                  aria-hidden
                >
                  {f.icon}
                </svg>
                <h2 className="mt-3 font-semibold">{f.title}</h2>
                <p className="mt-1 text-sm text-muted">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="estimer" className="mx-auto max-w-6xl scroll-mt-14 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <h2 className="text-2xl font-bold tracking-tight">Estimer un deck</h2>
        <p className="mb-6 mt-1 text-muted">Une carte par ligne, avec la réserve à la suite.</p>
        <Estimator />
      </section>
    </main>
  );
}
