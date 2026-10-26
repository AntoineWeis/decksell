import type { Metadata } from "next";
import Link from "next/link";
import { DataFlowArt, DeckBoxArt, DeckFanArt } from "@/components/about-art";

export const metadata: Metadata = {
  title: "Qui sommes-nous",
  description: "Pourquoi decksell existe, ses principes, d'où viennent les prix et le score méta, et ce qui arrive ensuite.",
  alternates: { canonical: "/qui-sommes-nous" },
};

/** Icônes au trait, même épaisseur que le reste du site. */
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
      {children}
    </svg>
  );
}

const PRINCIPLES = [
  {
    title: "Le deck entier est l'unité",
    text: "On estime, on vend et on achète un deck complet. Pas besoin de le découper carte par carte pour lui donner un prix.",
    icon: (
      <>
        <rect x="4" y="5" width="11" height="15" rx="2" />
        <path d="M9 3h9a2 2 0 0 1 2 2v13" />
      </>
    ),
  },
  {
    title: "Des prix qu'on peut vérifier",
    text: "Chaque estimation affiche sa source, sa date et sa règle de calcul. Une carte sans prix est signalée, jamais comptée en silence.",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
  },
  {
    title: "Une fiche qui répond avant qu'on demande",
    text: "Photos des vraies cartes, état et langue carte par carte, liste rangée par type, main de départ à tester : acheter à distance, c'est faire confiance, alors la fiche donne de quoi juger.",
    icon: (
      <>
        <path d="M4 8h3l2-3h6l2 3h3v11H4Z" />
        <circle cx="12" cy="13" r="3.5" />
      </>
    ),
  },
  {
    title: "Récompenser ce qui rassure",
    text: "Les badges des vendeurs (Réactif, Juste prix, Ancien…) se gagnent sur des faits vérifiés par le site, jamais déclarés. Ils saluent la fiabilité, pas l'activité pour l'activité.",
    icon: <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6Z M9 12l2 2 4-4" />,
  },
  {
    title: "Rien d'inventé",
    text: "Pas de faux avis, pas de chiffres d'utilisation gonflés. Ce qui n'existe pas encore est marqué comme tel.",
    icon: <path d="m5 12 4.5 4.5L19 7" />,
  },
  {
    title: "Tes données restent à toi",
    text: "Seul ton compte peut voir, modifier ou supprimer tes annonces et ton profil. Tes messages restent sur decksell, entre toi et l'autre membre. Les clés d'accès sensibles ne quittent jamais le serveur.",
    icon: (
      <>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
  },
];

export default function AboutPage() {
  return (
    <main className="flex-1">
      {/* Bandeau */}
      <section className="overflow-hidden bg-banner text-banner-ink">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <div>
            <h1 className="display text-4xl sm:text-5xl">Qui sommes-nous</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-banner-muted">
              decksell est un projet indépendant, pensé pour les joueurs de Modern qui veulent revendre ou acheter un
              deck complet au juste prix.
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
          </div>
          <DeckFanArt className="mx-auto w-full max-w-md" />
        </div>
      </section>

      {/* L'histoire du projet */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <DeckBoxArt className="order-last mx-auto w-full max-w-sm lg:order-first" />
        <div>
          <h2 className="display text-3xl sm:text-4xl">L&apos;histoire du projet</h2>
          <div className="mt-5 max-w-[62ch] space-y-4 leading-relaxed text-muted">
            <p>
              Revendre un deck Modern complet n&apos;est pas simple. Il faut chiffrer 75 cartes une par une, comparer
              les éditions, puis trouver un acheteur sur des sites pensés pour vendre des cartes à l&apos;unité.
              Souvent, le deck finit découpé.
            </p>
            <p>
              Les outils que les joueurs utilisent déjà savent construire un deck ou suivre le prix d&apos;une carte.
              Aucun ne va de la decklist entière jusqu&apos;à la vente du deck. decksell est né pour combler ce trou.
            </p>
            <p>
              Le principe : tu colles ta liste, tu obtiens sa valeur carte par carte en euros, et tu peux la mettre en
              vente au prix de ton choix. Vendeur et acheteur partent ainsi du même repère.
            </p>
            <p>
              Depuis, chaque annonce est devenue une vraie fiche : la jauge du juste prix face à la valeur du jour, les
              photos des cartes, leur état, la proximité avec le méta des tournois, le primer du vendeur. On écrit au
              vendeur et on lui fait une offre sans quitter le site, et les decks suivis préviennent quand leur prix
              baisse.
            </p>
          </div>
        </div>
      </section>

      {/* Nos principes */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="display text-3xl sm:text-4xl">Nos principes</h2>
          <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-link">
                  <Icon>{p.icon}</Icon>
                </span>
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* D'où viennent les données */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="display text-3xl sm:text-4xl">D&apos;où viennent les données</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          decksell ne fixe aucun prix lui-même. Il reprend des données publiques et te montre exactement lesquelles.
        </p>
        <div className="mt-10 overflow-x-auto rounded-xl border border-line bg-sunken p-4 sm:p-6">
          <DataFlowArt className="mx-auto w-full min-w-[520px] max-w-3xl" />
        </div>
        <dl className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="font-semibold">Les cartes</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">
              Noms, éditions, raretés et images viennent de{" "}
              <a href="https://scryfall.com" className="font-medium text-link hover:underline">
                Scryfall
              </a>
              , la base de données de référence des joueurs.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Les prix</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">
              Prix Cardmarket en euros, transmis par Scryfall. Chaque carte compte au prix de son impression non-foil la
              moins chère. La date des prix est affichée avec chaque estimation.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Le score méta</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">
              Chaque liste est comparée aux decklists des tournois officiels{" "}
              <a href="https://www.mtgo.com/decklists" className="font-medium text-link hover:underline">
                Magic Online
              </a>{" "}
              des 30 derniers jours, mises à jour chaque nuit. Le score dit à quel point le deck est proche du méta, pas
              s&apos;il gagne.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Ce qu&apos;ils valent</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">
              Une estimation est un repère, pas une offre de rachat. Le prix de vente reste toujours fixé par le vendeur.
            </dd>
          </div>
        </dl>
        <p className="mt-10 max-w-3xl border-t border-line pt-6 text-xs leading-relaxed text-muted">
          decksell est un contenu de fans non officiel, non approuvé par Wizards of the Coast. Magic: The Gathering, ses
          cartes et ses illustrations sont la propriété de Wizards of the Coast. Les illustrations de cette page ont été
          dessinées pour decksell.
        </p>
      </section>

      {/* Ce qui arrive */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="display text-3xl sm:text-4xl">Ce qui arrive</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            decksell est une vente en ligne, de bout en bout. Les prochaines étapes sont en préparation : elles ne sont pas
            encore disponibles.
          </p>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            <li className="rounded-xl border border-line bg-background p-5">
              <p className="flex items-center gap-2 font-semibold">
                Paiement sécurisé
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-link">En préparation</span>
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                L&apos;acheteur paie sur decksell, l&apos;argent est retenu par notre prestataire de paiement et
                n&apos;est versé au vendeur qu&apos;une fois le deck reçu. En cas de problème, la modération tranche.
              </p>
            </li>
            <li className="rounded-xl border border-line bg-background p-5">
              <p className="flex items-center gap-2 font-semibold">
                Envoi suivi
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-link">En préparation</span>
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Un envoi avec numéro de suivi pour chaque vente, en point relais ou à domicile avec signature, et une
                assurance conseillée pour les decks de valeur.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-banner text-banner-ink">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-14 sm:px-6">
          <div>
            <h2 className="display text-2xl sm:text-3xl">Nous contacter</h2>
            <p className="mt-2 max-w-xl text-banner-muted">
              Un moyen de nous écrire arrive bientôt. En attendant, le meilleur retour reste d&apos;utiliser decksell.
            </p>
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
