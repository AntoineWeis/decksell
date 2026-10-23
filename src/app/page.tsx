import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LatestDecks } from "@/components/latest-decks";

function LatestDecksSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16" aria-busy>
      <div className="h-9 w-72 animate-pulse rounded-lg bg-sunken" />
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="h-96 animate-pulse rounded-2xl bg-sunken" />
        <div className="hidden h-96 animate-pulse rounded-xl bg-sunken lg:block" />
      </div>
    </div>
  );
}

// Bandeau : marais brumeux de Kamigawa, 1920 × 1120, © Wizards of the Coast.
import heroArt from "../../public/hero-swamp.webp";

/** Icônes au trait, même épaisseur partout. */
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
      {children}
    </svg>
  );
}

const FEATURES = [
  {
    title: "Estimation instantanée",
    text: "Colle ta liste depuis MTGO, Arena, Moxfield ou MTGGoldfish : le total tombe en quelques secondes, sans créer de compte.",
    icon: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />,
  },
  {
    title: "Détail carte par carte",
    text: "Chaque carte avec son édition, sa rareté et son prix, triée par valeur. Tu vois tout de suite où est l'argent.",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 4v16" />
      </>
    ),
  },
  {
    title: "Mise en vente et suivi",
    text: "Publie ton deck au prix de ton choix, puis suis-le depuis ton espace : en vente, réservé, vendu.",
    icon: (
      <>
        <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" />
        <circle cx="8" cy="8" r="1.5" />
      </>
    ),
  },
];

const STEPS = [
  ["Colle ta liste", "Telle qu'exportée par ton outil habituel, réserve comprise."],
  ["Lis le prix", "Le total, la carte phare et le détail de chaque carte."],
  ["Complète si besoin", "Une carte sans prix ? Indique le tien, le total suit."],
  ["Mets-le en vente", "Fixe ton prix et suis l'annonce depuis ton espace."],
];

const TRUST = [
  {
    title: "Une source connue, datée",
    text: "Les prix viennent de Cardmarket, via Scryfall, en euros. La date de mise à jour est affichée avec chaque estimation.",
  },
  {
    title: "Une règle simple et constante",
    text: "Chaque carte compte au prix de son impression non-foil la moins chère. Pas de moyenne opaque, pas de coefficient caché.",
  },
  {
    title: "Rien n'est compté en silence",
    text: "Une carte introuvable ou sans prix est signalée et laissée hors du total, jusqu'à ce que tu indiques le tien.",
  },
  {
    title: "Tes annonces restent à toi",
    text: "Seul ton compte peut voir, modifier ou supprimer tes annonces et ton profil.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      {/* Bandeau d'accueil */}
      <section className="relative overflow-hidden bg-banner text-banner-ink">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src={heroArt}
            alt=""
            fill
            preload
            placeholder="blur"
            sizes="100vw"
            className="object-cover object-[60%_45%]"
          />
          {/* Dégradé à gauche : le texte reste lisible sur l'illustration */}
          <div className="absolute inset-0 bg-gradient-to-r from-banner/95 via-banner/70 to-banner/20" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-banner to-transparent" />
        </div>
        <p className="absolute right-4 top-3 z-10 text-[10px] text-white/70 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)] sm:right-6">
          Kamigawa · © Wizards of the Coast
        </p>
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
          <h1 className="display max-w-3xl text-4xl sm:text-6xl">Combien vaut ton deck Modern&nbsp;?</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-banner-muted">
            decksell chiffre ta decklist carte par carte d&apos;après les prix Cardmarket, en euros. Ensuite, mets ton
            deck en vente au juste prix et suis la vente depuis ton espace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/estimer"
              className="inline-flex h-11 items-center rounded-lg bg-accent px-5 font-semibold text-on-accent transition hover:bg-accent-hover"
            >
              Estimer mon deck
            </Link>
            <Link
              href="/inscription"
              className="inline-flex h-11 items-center rounded-lg px-5 font-semibold text-banner-ink ring-1 ring-white/25 transition hover:bg-white/10"
            >
              Créer un compte vendeur
            </Link>
          </div>
        </div>
      </section>

      {/* Derniers decks en vente : lus à part, le bandeau s'affiche sans les attendre. */}
      <Suspense fallback={<LatestDecksSkeleton />}>
        <LatestDecks />
      </Suspense>

      {/* Ce que fait decksell */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="display max-w-2xl text-3xl sm:text-4xl">Le prix de ton deck, puis sa vente, au même endroit</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          decksell est fait pour revendre et acheter des decks Modern complets entre joueurs, sans les découper carte
          par carte. L&apos;estimation donne aux deux côtés le même point de départ.
        </p>
        <ul className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title}>
              <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-link">
                <Icon>{f.icon}</Icon>
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Comment ça marche */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="display text-2xl sm:text-3xl">Comment ça marche</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="relative pl-12">
                <span className="absolute left-0 top-0 flex size-8 items-center justify-center rounded-md bg-accent text-sm font-semibold tabular-nums text-on-accent">
                  {i + 1}
                </span>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Réassurance sur les prix */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div>
          <h2 className="display text-3xl sm:text-4xl">Des prix que tu peux vérifier</h2>
          <p className="mt-3 leading-relaxed text-muted">
            Une estimation n&apos;est utile que si on sait d&apos;où elle vient. Voilà exactement comment decksell
            calcule la valeur d&apos;un deck.
          </p>
          <p className="mt-4 text-sm text-muted">
            Les prix sont indicatifs : ils servent de repère, ce ne sont pas des offres de rachat.
          </p>
        </div>
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {TRUST.map((t) => (
            <li key={t.title} className="flex gap-4 px-5 py-4">
              <span className="mt-0.5 text-ok">
                <Icon>
                  <path d="m5 12 4.5 4.5L19 7" />
                </Icon>
              </span>
              <div>
                <p className="font-semibold">{t.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{t.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Vendeurs et acheteurs */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-background p-6">
            <h2 className="display text-2xl">Tu vends ton deck</h2>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
              <li>Connais sa valeur avant de fixer ton prix.</li>
              <li>Publie l&apos;annonce depuis l&apos;estimation, en un clic.</li>
              <li>Suis chaque annonce : en vente, réservé, vendu, retiré.</li>
            </ul>
            <Link href="/estimer" className="mt-6 inline-flex font-semibold text-link hover:underline">
              Estimer et mettre en vente →
            </Link>
          </div>
          <div className="rounded-xl border border-line bg-background p-6">
            <h2 className="display text-2xl">Tu cherches un deck</h2>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
              <li>Parcours les decks complets mis en vente par les joueurs.</li>
              <li>Compare le prix demandé à la valeur du jour, carte par carte.</li>
              <li>Vois d&apos;un coup d&apos;œil la part de cartes en français et en anglais.</li>
            </ul>
            <Link href="/decks" className="mt-6 inline-flex font-semibold text-link hover:underline">
              Voir les decks en vente →
            </Link>
          </div>
        </div>
      </section>

      {/* Appel final */}
      <section className="bg-banner text-banner-ink">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-14 sm:px-6">
          <div>
            <h2 className="display text-2xl sm:text-3xl">Prêt à connaître la valeur de ton deck&nbsp;?</h2>
            <p className="mt-2 text-banner-muted">Sans compte, en quelques secondes.</p>
          </div>
          <Link
            href="/estimer"
            className="inline-flex h-11 items-center rounded-lg bg-accent px-5 font-semibold text-on-accent transition hover:bg-accent-hover"
          >
            Estimer mon deck
          </Link>
        </div>
      </section>
    </main>
  );
}
