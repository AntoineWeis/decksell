import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LatestDecks } from "@/components/latest-decks";
import { DeckPreview, DeckPreviewSkeleton } from "@/components/deck-preview";

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

/** Les deux parcours, en trois étapes chacun. */
const PATHS = [
  {
    title: "Tu vends ton deck",
    steps: [
      ["Colle ta liste", "Depuis MTGO, Arena, Moxfield ou MTGGoldfish, réserve comprise. La valeur tombe en quelques secondes, sans compte."],
      ["Fixe ton prix", "Tu vois ce que vaut chaque carte. Une carte sans prix ? Indique le tien. Précise l'état et la langue de tes cartes."],
      ["Publie et réponds", "Les acheteurs t'écrivent et te font des offres depuis l'annonce ; tu es prévenu par e-mail. Passe-la en réservé, puis en vendu."],
    ],
    cta: { href: "/estimer", label: "Estimer mon deck →" },
  },
  {
    title: "Tu cherches un deck",
    steps: [
      ["Parcours les decks", "Filtre par couleur, archétype ou carte présente dans la liste, et trie par prix ou par meilleure affaire."],
      ["Examine la fiche", "Prix demandé face à la valeur du jour, état et langue carte par carte, liste rangée par type, courbe de mana."],
      ["Écris au vendeur", "Pose tes questions ou fais une offre depuis l'annonce. Garde les decks qui te tentent dans tes favoris."],
    ],
    cta: { href: "/decks", label: "Voir les decks en vente →" },
  },
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
    text: "Une carte introuvable ou sans prix est signalée et laissée hors du total, jusqu'à ce que le vendeur indique le sien.",
  },
  {
    title: "Des decks vérifiés avant publication",
    text: "60 cartes au moins, 15 en réserve au plus, aucune carte interdite en Modern : sinon, l'annonce n'est pas publiée.",
  },
  {
    title: "L'état et la langue, carte par carte",
    text: "Le vendeur les déclare pour chaque carte. Tu sais ce que tu achètes avant d'écrire.",
  },
  {
    title: "Des échanges qui restent sur decksell",
    text: "Messages et offres passent par la messagerie du site. Une conversation abusive se signale en un clic et l'équipe la modère.",
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
          <h1 className="display max-w-3xl text-4xl sm:text-6xl">Des decks Modern complets, au juste prix</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-banner-muted">
            decksell estime chaque deck carte par carte d&apos;après les prix Cardmarket. Les vendeurs savent quoi
            demander, les acheteurs comparent avant de faire une offre.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/estimer"
              className="inline-flex h-11 items-center rounded-lg bg-accent px-5 font-semibold text-on-accent transition hover:bg-accent-hover"
            >
              Estimer mon deck
            </Link>
            <Link
              href="/decks"
              className="inline-flex h-11 items-center rounded-lg px-5 font-semibold text-banner-ink ring-1 ring-white/25 transition hover:bg-white/10"
            >
              Voir les decks en vente
            </Link>
          </div>
          <p className="mt-4 text-sm text-banner-muted">Estimation gratuite et sans compte · Prix Cardmarket en euros</p>
        </div>
      </section>

      {/* Derniers decks en vente : lus à part, le bandeau s'affiche sans les attendre. */}
      <Suspense fallback={<LatestDecksSkeleton />}>
        <LatestDecks />
      </Suspense>

      {/* Les deux parcours : vendre, acheter */}
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20">
        <h2 className="display max-w-2xl text-3xl sm:text-4xl">Vendre ou acheter, au même endroit</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          decksell sert à revendre et acheter des decks Modern entiers entre joueurs, sans les découper carte par carte.
          L&apos;estimation donne aux deux côtés le même point de départ.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {PATHS.map((path) => (
            <div key={path.title} className="flex flex-col rounded-xl border border-line bg-surface p-6">
              <h3 className="display text-2xl">{path.title}</h3>
              <ol className="mt-6 space-y-5">
                {path.steps.map(([title, text], i) => (
                  <li key={title} className="relative pl-12">
                    <span className="absolute left-0 top-0 flex size-8 items-center justify-center rounded-md bg-brand-soft text-sm font-semibold tabular-nums text-link">
                      {i + 1}
                    </span>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
                  </li>
                ))}
              </ol>
              <Link href={path.cta.href} className="mt-auto inline-flex pt-6 font-semibold text-link hover:underline">
                {path.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Aperçu d'une vraie fiche deck : lu à part, comme les derniers decks. */}
      <Suspense fallback={<DeckPreviewSkeleton />}>
        <DeckPreview />
      </Suspense>

      {/* Confiance : les prix, les annonces, les échanges */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <h2 className="display text-3xl">Des prix vérifiables, des annonces contrôlées</h2>
            <p className="mt-3 leading-relaxed text-muted">
              Une estimation n&apos;est utile que si on sait d&apos;où elle vient, et une annonce que si on peut s&apos;y
              fier.
            </p>
            <p className="mt-4 text-sm text-muted">
              Les prix sont indicatifs : ils servent de repère, ce ne sont pas des offres de rachat.
            </p>
          </div>
          <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {TRUST.map((t) => (
              <li key={t.title} className="flex gap-3">
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
        </div>
      </section>

      {/* Appel final */}
      <section className="bg-banner text-banner-ink">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-14 sm:px-6">
          <div>
            <h2 className="display text-2xl sm:text-3xl">Prêt à connaître la valeur de ton deck&nbsp;?</h2>
            <p className="mt-2 text-banner-muted">Gratuit, sans compte, en quelques secondes.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/estimer"
              className="inline-flex h-11 items-center rounded-lg bg-accent px-5 font-semibold text-on-accent transition hover:bg-accent-hover"
            >
              Estimer mon deck
            </Link>
            <Link
              href="/decks"
              className="inline-flex h-11 items-center rounded-lg px-5 font-semibold text-banner-ink ring-1 ring-white/25 transition hover:bg-white/10"
            >
              Voir les decks
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
