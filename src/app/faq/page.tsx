import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection as Section } from "@/components/legal";
import { jsonLdScript } from "@/lib/structured-data";
import { EDITOR } from "@/lib/editor";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description:
    "Acheter ou vendre un deck Modern ou Commander sur decksell : prix, estimation, éditions, paiement, envoi, MetaScore, niveau de puissance, compte.",
  alternates: { canonical: "/faq" },
};

const UPDATED = "28 octobre 2026";

type Qa = { q: string; a: string };
type Theme = { id: string; title: string; items: Qa[] };

// Réponses en texte simple : elles servent aussi aux données structurées (FAQPage) lues par Google.
const THEMES: Theme[] = [
  {
    id: "acheter",
    title: "Acheter un deck",
    items: [
      {
        q: "Comment acheter un deck ?",
        a: "Choisis un deck dans le catalogue Modern ou Commander, ouvre sa fiche puis clique sur « Contacter le vendeur ». La messagerie de decksell te permet de poser tes questions et de faire une offre. Le paiement et l'envoi se conviennent ensuite directement avec le vendeur.",
      },
      {
        q: "Le paiement passe-t-il par decksell ?",
        a: "Pas encore : aujourd'hui, decksell n'encaisse aucun paiement. Un paiement sécurisé, où l'argent n'est versé au vendeur qu'une fois le deck reçu, est en préparation. En attendant, privilégie un moyen de paiement qui te protège en cas de litige, et méfie-toi d'une demande de paiement pressante ou faite hors de la messagerie.",
      },
      {
        q: "Comment savoir si le prix demandé est juste ?",
        a: "Chaque fiche compare le prix demandé à la valeur du jour du deck, calculée carte par carte d'après Cardmarket. Une jauge indique s'il est sous la valeur, au juste prix ou au-dessus, et la liste montre le prix de chaque carte.",
      },
      {
        q: "Les cartes sont-elles vérifiées par decksell ?",
        a: "Non, decksell ne voit pas les cartes. Le vendeur déclare l'état et la langue de chaque carte et peut ajouter jusqu'à 6 photos du deck. N'hésite pas à lui demander des photos des cartes chères avant d'acheter.",
      },
      {
        q: "Puis-je négocier le prix ?",
        a: "Oui : depuis la messagerie, tu peux faire une offre au vendeur, qui l'accepte ou la refuse.",
      },
      {
        q: "Comment être prévenu d'une baisse de prix ?",
        a: "Ajoute le deck à tes favoris. Si son prix baisse, tu reçois un email, que tu peux désactiver dans ton profil.",
      },
      {
        q: "Que faire en cas de problème avec un vendeur ?",
        a: "Depuis la conversation, tu peux bloquer le membre et signaler l'échange. L'équipe de modération lit alors la conversation signalée et peut retirer l'annonce ou suspendre le compte.",
      },
    ],
  },
  {
    id: "vendre",
    title: "Vendre un deck",
    items: [
      {
        q: "Comment mettre mon deck en vente ?",
        a: "Sur la page « Estimer un deck », colle ta liste ou importe-la, puis clique sur « Mettre en vente ». Indique un titre, ton prix et l'état des cartes, puis publie. Il faut un compte, réservé aux personnes de 18 ans ou plus.",
      },
      {
        q: "Combien coûte une annonce ?",
        a: "Rien : decksell est gratuit et ne prend aucune commission sur les ventes. Si un service payant arrive un jour, il sera annoncé à l'avance et ne s'appliquera qu'avec ton accord.",
      },
      {
        q: "Quel prix demander ?",
        a: "Tu fixes ton prix librement. L'estimation sert de repère, et decksell te prévient si ton prix est très au-dessus ou très en dessous de la valeur du deck.",
      },
      {
        q: "Pourquoi mon annonce ne peut-elle pas être publiée ?",
        a: "decksell vérifie les règles du format avant publication. En Modern : 60 cartes au moins et 15 en réserve au plus. En Commander : 100 cartes commandant compris, un seul exemplaire par carte hors terrains de base, et l'identité de couleur du commandant. Dans les deux cas, aucune carte interdite. Le message affiché indique ce qu'il faut corriger.",
      },
      {
        q: "Comment modifier ou retirer mon annonce ?",
        a: "Depuis « Mes annonces », tu peux changer le prix, le statut (en vente, réservé, vendu, retiré), la liste, l'état et la langue des cartes, les photos et le primer.",
      },
      {
        q: "Qu'est-ce que le primer ?",
        a: "Un texte facultatif où tu expliques comment jouer ton deck : plan de jeu, mulligans, réserve contre le méta. Il peut faire jusqu'à 6 000 caractères et rassure les acheteurs.",
      },
      {
        q: "À quoi servent les badges ?",
        a: "Les badges (Réactif, Juste prix, Ancien…) sont calculés par le site à partir de faits : délai de réponse, prix proches de la valeur, ancienneté. Ils ne se déclarent pas et rassurent les acheteurs.",
      },
      {
        q: "Je vends à titre professionnel : que dois-je faire ?",
        a: "Tu dois l'indiquer dans ton annonce et respecter les obligations des professionnels, notamment envers les consommateurs.",
      },
    ],
  },
  {
    id: "prix",
    title: "Prix et estimation",
    items: [
      {
        q: "D'où viennent les prix ?",
        a: "Les prix viennent de Cardmarket, en euros, transmis par Scryfall et mis à jour chaque jour. La date des prix est affichée avec chaque estimation.",
      },
      {
        q: "Comment est calculée la valeur d'un deck ?",
        a: "Chaque carte compte au prix de l'édition indiquée dans ta liste (numéro de collection et foil compris), sinon au prix de son impression la moins chère. La valeur du deck est la somme de toutes ses cartes.",
      },
      {
        q: "Pourquoi mon estimation diffère-t-elle d'un autre site ?",
        a: "Les sites ne prennent pas tous le même prix de référence : prix le plus bas, tendance, moyenne, édition la plus courante. decksell prend l'édition de ta liste, sinon la moins chère. L'état et la langue des cartes ne sont pas comptés dans l'estimation.",
      },
      {
        q: "Comment obtenir les bonnes éditions et les bons prix ?",
        a: "Importe ton deck par son lien Archidekt, ou colle l'export Moxfield « Copier pour Moxfield » : chaque carte garde alors son édition et son foil. Une liste tapée à la main ou exportée depuis MTGO compte les cartes au prix de leur version la moins chère.",
      },
      {
        q: "Une carte n'a pas de prix : que faire ?",
        a: "Elle est signalée et laissée hors du total. Tu peux indiquer toi-même son prix à l'unité : le total se met à jour.",
      },
      {
        q: "L'estimation est-elle une offre de rachat ?",
        a: "Non. C'est un repère indicatif, pas une offre ni une garantie de prix de revente. Le prix de vente reste fixé par le vendeur.",
      },
    ],
  },
  {
    id: "formats",
    title: "Modern et Commander",
    items: [
      {
        q: "Quels formats sont acceptés ?",
        a: "Modern et Commander, chacun avec son catalogue, ses règles et son critère phare.",
      },
      {
        q: "Qu'est-ce que le MetaScore ?",
        a: "Pour un deck Modern, un score de 0 à 100 qui mesure la ressemblance de la liste avec les decks des tournois Magic Online des 30 derniers jours. Il dit à quel point le deck est proche du méta, pas s'il gagne.",
      },
      {
        q: "Qu'est-ce que le niveau de puissance ?",
        a: "Pour un deck Commander, son niveau sur l'échelle officielle de 1 à 5 (les « brackets »). decksell déduit de la liste un niveau minimum : Game Changers, combos à deux cartes, tours supplémentaires, destruction massive de terrains. Le vendeur annonce son niveau, jamais en dessous de ce minimum, et peut le modifier.",
      },
      {
        q: "Comment decksell reconnaît-il un deck Commander ?",
        a: "À sa forme : une section « Commander » dans la liste, la catégorie Commander d'Archidekt, ou 100 cartes en un exemplaire avec le commandant à part. Tu peux toujours corriger le format et choisir ton commandant avant de publier.",
      },
    ],
  },
  {
    id: "compte",
    title: "Compte et données",
    items: [
      {
        q: "Faut-il un compte pour estimer un deck ?",
        a: "Non : l'estimation et la consultation des annonces sont ouvertes à tous, sans compte.",
      },
      {
        q: "Mon adresse email est-elle visible ?",
        a: "Jamais, pas même par les membres avec qui tu échanges. Ton pseudo, ta photo, tes liens Moxfield ou Archidekt et ton lieu d'expédition, s'il est renseigné, apparaissent sur tes annonces.",
      },
      {
        q: "Comment supprimer mon compte ?",
        a: "En bas de ton profil, avec le bouton « Supprimer mon compte ». Ton profil, tes photos et tes annonces sont effacés définitivement.",
      },
      {
        q: "Pourquoi n'y a-t-il pas de bandeau de cookies ?",
        a: "Parce que decksell ne dépose aucun cookie de suivi ni de publicité. Le seul cookie sert à rester connecté, et la mesure d'audience est anonyme et sans cookie.",
      },
    ],
  },
  {
    id: "decksell",
    title: "À propos de decksell",
    items: [
      {
        q: "decksell est-il un site officiel de Magic ?",
        a: "Non. decksell est un contenu de fans non officiel, non approuvé par Wizards of the Coast. Les données et images de cartes viennent de Scryfall.",
      },
      {
        q: "Comment contacter l'équipe ?",
        a: `Écris à ${EDITOR.email} : pour une question, une idée, un bug ou un souci avec une annonce.`,
      },
    ],
  },
];

const SECTIONS = THEMES.map(({ id, title }) => ({ id, title }));

// Données structurées : les questions et réponses, pour les résultats enrichis de Google.
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: THEMES.flatMap((t) =>
    t.items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  ),
};

export default function FaqPage() {
  return (
    <LegalPage
      title="Questions fréquentes"
      intro="Acheter, vendre, comprendre les prix et les formats : les réponses aux questions qu'on nous pose le plus."
      updated={UPDATED}
      sections={SECTIONS}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(FAQ_JSON_LD) }} />
      {THEMES.map((theme, i) => (
        <Section key={theme.id} n={i + 1} id={theme.id} title={theme.title}>
          {/* Questions repliées : <details> natif, ouvrable au clavier et lu par les lecteurs d'écran. */}
          <div className="mt-4 divide-y divide-line rounded-xl border border-line bg-surface">
            {theme.items.map(({ q, a }) => (
              <details key={q} className="group px-4 py-3 sm:px-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                  {q}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4 shrink-0 text-muted transition group-open:rotate-180"
                    aria-hidden
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <p className="!mt-2 text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </Section>
      ))}

      <p className="border-t border-line pt-6 text-sm text-muted">
        Ta question n&apos;y est pas ? Écris à{" "}
        <a href={`mailto:${EDITOR.email}`} className="font-medium text-link hover:underline">
          {EDITOR.email}
        </a>
        , ou consulte les{" "}
        <Link href="/conditions-utilisation" className="font-medium text-link hover:underline">
          conditions d&apos;utilisation
        </Link>
        .
      </p>
    </LegalPage>
  );
}
