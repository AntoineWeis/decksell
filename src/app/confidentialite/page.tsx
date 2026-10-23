import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection as Section, ToComplete } from "@/components/legal";

export const metadata: Metadata = {
  title: "Confidentialité",
  description:
    "Quelles données personnelles decksell traite, pourquoi, combien de temps, et comment exercer tes droits (RGPD).",
};

const UPDATED = "21 octobre 2026";

const SECTIONS = [
  { id: "responsable", title: "Responsable du traitement" },
  { id: "donnees", title: "Données traitées" },
  { id: "finalites", title: "Pourquoi et sur quelle base" },
  { id: "visibilite", title: "Ce qui est public" },
  { id: "prestataires", title: "Prestataires et transferts" },
  { id: "conservation", title: "Durée de conservation" },
  { id: "cookies", title: "Cookies et stockage local" },
  { id: "securite", title: "Sécurité" },
  { id: "droits", title: "Tes droits" },
  { id: "modification", title: "Modification de cette page" },
];

const linkClass = "font-medium text-link hover:underline";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Confidentialité"
      intro="Quelles données decksell utilise, pourquoi, combien de temps, et comment garder la main dessus, conformément au RGPD."
      updated={UPDATED}
      sections={SECTIONS}
    >
      <div className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
        <p className="!mt-0 font-semibold">En bref</p>
        <ul className="text-muted">
          <li>Estimer un deck ne demande ni compte, ni donnée personnelle.</li>
          <li>Un compte sert seulement à publier et suivre tes annonces : email, pseudo, photo et liens facultatifs.</li>
          <li>Aucune publicité, aucun traceur, aucune revente de données.</li>
          <li>
            Tu peux supprimer ton compte toi-même, à tout moment, depuis{" "}
            <Link href="/espace/profil" className={linkClass}>
              ton profil
            </Link>
            .
          </li>
        </ul>
      </div>

      <Section n={1} id="responsable" title="Responsable du traitement">
        <p>
          Le responsable du traitement des données est l&apos;éditeur de decksell :{" "}
          <ToComplete>nom ou raison sociale, adresse et email de contact</ToComplete>
        </p>
      </Section>

      <Section n={2} id="donnees" title="Données traitées">
        <p>
          <strong>Sans compte</strong>, decksell ne te demande rien. La decklist que tu colles sert seulement à calculer
          l&apos;estimation : elle n&apos;est pas enregistrée en base.
        </p>
        <p>
          <strong>Avec un compte</strong>, decksell traite :
        </p>
        <ul>
          <li>ton adresse email et ton mot de passe, stocké sous une forme chiffrée que personne ne peut relire ;</li>
          <li>ton pseudo et, si tu les ajoutes, ta photo de profil et tes liens Moxfield et Archidekt ;</li>
          <li>
            tes annonces : decklist, prix, état, langue des cartes, couleurs, archétype, description, statut et, une
            fois le deck vendu, le prix et la date de la vente ;
          </li>
          <li>
            tes messages avec les autres membres, liés à une annonce, ainsi que les membres que tu bloques et les
            conversations que tu signales ;
          </li>
          <li>
            des données techniques de connexion (date de création du compte, dernière connexion, adresse IP) conservées
            par le prestataire d&apos;authentification pour sécuriser les comptes.
          </li>
        </ul>
        <p>decksell ne demande ni donnée bancaire, ni pièce d&apos;identité, ni adresse postale.</p>
      </Section>

      <Section n={3} id="finalites" title="Pourquoi et sur quelle base">
        <ul>
          <li>
            <strong>Gérer ton compte et tes annonces</strong>, le service que tu demandes en acceptant les{" "}
            <Link href="/conditions-utilisation" className={linkClass}>
              conditions d&apos;utilisation
            </Link>{" "}
            : exécution du contrat.
          </li>
          <li>
            <strong>Mettre en relation acheteurs et vendeurs</strong> par la messagerie, liée à une annonce :
            exécution du contrat. Les messages ne sont lus que par les deux participants. decksell n&apos;y accède
            qu&apos;en cas de signalement, pour traiter le problème signalé.
          </li>
          <li>
            <strong>T&apos;envoyer les emails du service</strong> (confirmation d&apos;inscription, lien de nouveau mot
            de passe, alerte de nouveau message que tu peux désactiver dans ton profil), jamais d&apos;email
            commercial : exécution du contrat.
          </li>
          <li>
            <strong>Sécuriser le site</strong> et prévenir les abus, grâce aux journaux techniques des prestataires :
            intérêt légitime.
          </li>
        </ul>
      </Section>

      <Section n={4} id="visibilite" title="Ce qui est public">
        <p>
          Sur une annonce en vente ou réservée, tout visiteur voit son contenu ainsi que ton pseudo, ta photo et tes
          liens Moxfield et Archidekt. <strong>Ton adresse email n&apos;est jamais affichée</strong>, pas même aux
          membres avec qui tu échanges des messages. Une annonce
          retirée ou vendue n&apos;apparaît plus dans la liste publique.
        </p>
      </Section>

      <Section n={5} id="prestataires" title="Prestataires et transferts">
        <p>
          Tes données ne sont ni vendues ni louées. Seuls ces prestataires techniques y ont accès, pour faire
          fonctionner le site :
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> : base de données, comptes et stockage des photos de profil.{" "}
            <ToComplete>région d&apos;hébergement du projet</ToComplete>
          </li>
          <li>
            <strong>Vercel</strong> : hébergement du site. Il traite l&apos;adresse IP des visiteurs pour servir les
            pages.
          </li>
          <li>
            <strong>Resend</strong> : envoi des alertes de nouveau message. Il reçoit ton adresse email, le pseudo de
            l&apos;expéditeur et le titre de l&apos;annonce, jamais le texte des messages.
          </li>
          <li>
            <strong>Scryfall</strong> : les images de cartes et les symboles de mana sont chargés depuis ses serveurs,
            qui reçoivent donc ton adresse IP. Aucune donnée de compte ne lui est envoyée.
          </li>
        </ul>
        <p>
          Supabase, Vercel et Resend sont des sociétés américaines : certaines données peuvent être traitées hors de
          l&apos;Union européenne, avec les garanties prévues par le RGPD, comme les clauses contractuelles types de la
          Commission européenne.
        </p>
      </Section>

      <Section n={6} id="conservation" title="Durée de conservation">
        <ul>
          <li>
            <strong>Compte, profil, photo et annonces</strong> : tant que ton compte existe. Ils sont effacés dès que tu
            le supprimes.
          </li>
          <li>
            <strong>Messages</strong> : tant que l&apos;annonce et les comptes des deux participants existent. Ils sont
            effacés quand l&apos;un des deux supprime son compte ou quand le vendeur supprime l&apos;annonce.
          </li>
          <li>
            <strong>Journaux techniques</strong> des prestataires : selon leurs propres durées, limitées à ce qui est
            nécessaire à la sécurité.
          </li>
        </ul>
      </Section>

      <Section n={7} id="cookies" title="Cookies et stockage local">
        <ul>
          <li>
            <strong>Un cookie de session</strong>, déposé seulement quand tu te connectes, pour te garder connecté.
            Indispensable au service, il ne demande pas de consentement.
          </li>
          <li>
            <strong>Le brouillon de ta decklist</strong>, gardé dans ton navigateur le temps de l&apos;onglet pour ne
            pas le perdre en changeant de page. Il n&apos;est envoyé nulle part tant que tu ne lances pas
            l&apos;estimation.
          </li>
        </ul>
        <p>Aucun cookie publicitaire, aucun outil de mesure d&apos;audience, aucun traceur de réseau social.</p>
      </Section>

      <Section n={8} id="securite" title="Sécurité">
        <ul>
          <li>Les échanges avec le site sont chiffrés (HTTPS).</li>
          <li>
            Chaque membre ne peut lire et modifier que son propre profil, ses annonces et sa photo. C&apos;est la base
            de données qui l&apos;impose, pas seulement le site.
          </li>
          <li>Les clés d&apos;accès sensibles restent sur le serveur et ne sont jamais envoyées au navigateur.</li>
        </ul>
      </Section>

      <Section n={9} id="droits" title="Tes droits">
        <p>Le RGPD te donne plusieurs droits sur tes données :</p>
        <ul>
          <li>
            l&apos;<strong>accès</strong> et la <strong>rectification</strong> : la plupart de tes données se
            consultent et se modifient directement dans{" "}
            <Link href="/espace" className={linkClass}>
              ton espace
            </Link>
            ;
          </li>
          <li>
            l&apos;<strong>effacement</strong> : le bouton <em>Supprimer mon compte</em>, en bas de{" "}
            <Link href="/espace/profil" className={linkClass}>
              ton profil
            </Link>
            , efface tout immédiatement ;
          </li>
          <li>
            la <strong>portabilité</strong>, l&apos;<strong>opposition</strong> et la <strong>limitation</strong> du
            traitement ;
          </li>
          <li>le droit de décider de ce que deviennent tes données après ton décès.</li>
        </ul>
        <p>
          Pour toute demande qui ne se fait pas depuis ton espace, écris à{" "}
          <ToComplete>email de contact pour les demandes RGPD</ToComplete>. Tu recevras une réponse sous un mois.
        </p>
        <p>
          Si tu estimes que tes droits ne sont pas respectés, tu peux adresser une réclamation à la{" "}
          <a href="https://www.cnil.fr/fr/plaintes" className={linkClass}>
            CNIL
          </a>
          .
        </p>
      </Section>

      <Section n={10} id="modification" title="Modification de cette page">
        <p>
          Cette page évolue avec le site, par exemple si un nouveau prestataire ou une nouvelle fonction apparaît. La
          date de mise à jour figure en haut. En cas de changement important, les membres en seront informés.
        </p>
      </Section>
    </LegalPage>
  );
}
