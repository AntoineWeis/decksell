import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection as Section } from "@/components/legal";
import { EDITOR, HOSTS } from "@/lib/editor";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Les règles d'utilisation de decksell : estimation des prix, annonces, comptes et données personnelles.",
  alternates: { canonical: "/conditions-utilisation" },
};

const UPDATED = "26 octobre 2026";

const SECTIONS = [
  { id: "objet", title: "Objet" },
  { id: "editeur", title: "Éditeur et hébergement" },
  { id: "compte", title: "Accès au service et compte" },
  { id: "estimation", title: "Estimation des prix" },
  { id: "annonces", title: "Annonces" },
  { id: "transactions", title: "Ventes entre membres" },
  { id: "gratuite", title: "Gratuité" },
  { id: "propriete", title: "Propriété intellectuelle" },
  { id: "donnees", title: "Données personnelles" },
  { id: "responsabilite", title: "Responsabilité et disponibilité" },
  { id: "modification", title: "Modification des conditions" },
  { id: "droit", title: "Droit applicable" },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Conditions d'utilisation"
      intro="Les règles qui encadrent l'utilisation de decksell, pour les visiteurs comme pour les membres."
      updated={UPDATED}
      sections={SECTIONS}
    >
      <Section n={1} id="objet" title="Objet">
        <p>
          decksell est un site qui permet d&apos;estimer la valeur de decks Magic: The Gathering au format Modern,
          d&apos;après les prix Cardmarket, et de mettre ces decks en vente entre particuliers. Les présentes
          conditions encadrent l&apos;utilisation du site par toute personne qui le consulte (« visiteur ») ou qui
          y crée un compte (« membre »).
        </p>
        <p>Utiliser decksell implique d&apos;accepter ces conditions.</p>
      </Section>

      <Section n={2} id="editeur" title="Éditeur et hébergement">
        <p>
          Le site est édité par <strong>{EDITOR.name}</strong>, entrepreneur individuel ({EDITOR.status}), SIREN{" "}
          {EDITOR.siren}, TVA intracommunautaire {EDITOR.vat}, {EDITOR.address}. Contact :{" "}
          <a href={`mailto:${EDITOR.email}`} className="font-medium text-link hover:underline">
            {EDITOR.email}
          </a>
          .
        </p>
        <p>Directeur de la publication : {EDITOR.name}.</p>
        <p>Hébergeurs :</p>
        <ul>
          {HOSTS.map((h) => (
            <li key={h.name}>
              <strong>{h.name}</strong> ({h.role}), {h.address}.
            </li>
          ))}
        </ul>
      </Section>

      <Section n={3} id="compte" title="Accès au service et compte">
        <ul>
          <li>L&apos;estimation d&apos;un deck et la consultation des annonces sont ouvertes à tous, sans compte.</li>
          <li>
            Créer un compte et publier des annonces est réservé aux personnes <strong>âgées de 18 ans ou plus</strong>.
          </li>
          <li>
            Le membre fournit une adresse email valide et choisit un mot de passe d&apos;au moins 8 caractères. Il
            est responsable de la confidentialité de ses identifiants et de toute activité réalisée depuis son
            compte.
          </li>
          <li>
            Le pseudo, la photo de profil et les liens vers Moxfield ou Archidekt sont visibles par les autres
            utilisateurs sur les annonces du membre. Ils ne doivent pas porter atteinte aux droits d&apos;autrui.
          </li>
          <li>
            Le membre peut supprimer son compte à tout moment depuis son profil. Son profil, sa photo et ses
            annonces sont alors effacés définitivement.
          </li>
        </ul>
      </Section>

      <Section n={4} id="estimation" title="Estimation des prix">
        <ul>
          <li>
            Les prix proviennent de Cardmarket, transmis par{" "}
            <a href="https://scryfall.com" className="font-medium text-link hover:underline">
              Scryfall
            </a>
            . Chaque carte est comptée au prix de son impression non-foil la moins chère, à la date indiquée avec
            l&apos;estimation.
          </li>
          <li>
            Une estimation est un <strong>repère indicatif</strong>. Ce n&apos;est ni une offre d&apos;achat, ni
            une garantie de prix de revente. Les prix réels varient selon l&apos;édition, l&apos;état, la langue et
            le marché.
          </li>
          <li>
            Une carte introuvable ou sans prix est signalée et exclue du total. Les prix saisis à la main par un
            utilisateur relèvent de sa seule responsabilité.
          </li>
        </ul>
      </Section>

      <Section n={5} id="annonces" title="Annonces">
        <p>En publiant une annonce, le vendeur s&apos;engage à ce que :</p>
        <ul>
          <li>il possède les cartes du deck et peut les vendre librement ;</li>
          <li>
            les cartes sont <strong>authentiques</strong> : les copies, proxies et contrefaçons sont interdits ;
          </li>
          <li>
            les informations de l&apos;annonce sont exactes : liste, état des cartes, part de cartes en français et
            en anglais, couleurs, archétype et description ;
          </li>
          <li>le prix demandé est celui qu&apos;il est prêt à accepter ; il le fixe librement ;</li>
          <li>il tient le statut de l&apos;annonce à jour (en vente, réservé, vendu, retiré).</li>
        </ul>
        <p>
          Les informations déclarées par le vendeur, comme la langue des cartes, ne sont pas vérifiées par decksell.
          decksell peut retirer une annonce contraire à ces conditions ou à la loi.
        </p>
      </Section>

      <Section n={6} id="transactions" title="Ventes entre membres">
        <ul>
          <li>
            decksell met en relation des vendeurs et des acheteurs mais <strong>n&apos;est pas partie aux
            ventes</strong>. Le site n&apos;encaisse aucun paiement et n&apos;expédie aucune carte.
          </li>
          <li>
            Les conditions de la vente (prix final, paiement, envoi) sont convenues
            directement entre le vendeur et l&apos;acheteur, sous leur responsabilité.
          </li>
          <li>
            Un vendeur qui agit à titre professionnel doit l&apos;indiquer et respecter les obligations qui
            s&apos;imposent aux professionnels, notamment envers les consommateurs.
          </li>
          <li>La prise de contact entre acheteurs et vendeurs sur decksell est en préparation.</li>
        </ul>
      </Section>

      <Section n={7} id="gratuite" title="Gratuité">
        <p>
          decksell est actuellement <strong>gratuit</strong> pour les visiteurs, les vendeurs et les acheteurs, et
          ne prélève aucune commission sur les ventes. Si des services payants sont proposés à l&apos;avenir, ils
          seront annoncés à l&apos;avance et ne s&apos;appliqueront qu&apos;avec l&apos;accord du membre.
        </p>
      </Section>

      <Section n={8} id="propriete" title="Propriété intellectuelle">
        <ul>
          <li>
            Magic: The Gathering, ses noms de cartes, illustrations et symboles sont la propriété de Wizards of the
            Coast. decksell est un contenu de fans non officiel, non approuvé par Wizards of the Coast.
          </li>
          <li>Les données et images de cartes sont fournies par Scryfall.</li>
          <li>Le site, son code, sa présentation et ses illustrations originales appartiennent à son éditeur.</li>
          <li>
            Le membre reste propriétaire de ce qu&apos;il publie (textes, photo de profil). Il autorise decksell à
            l&apos;afficher sur le site le temps de sa publication.
          </li>
        </ul>
      </Section>

      <Section n={9} id="donnees" title="Données personnelles">
        <p>decksell traite uniquement les données nécessaires au service :</p>
        <ul>
          <li>pour un membre : email, pseudo, photo de profil, liens Moxfield et Archidekt, annonces ;</li>
          <li>
            un cookie de session, indispensable à la connexion, déposé uniquement quand le membre se connecte ;
          </li>
          <li>
            la decklist en cours de saisie, gardée dans le navigateur le temps de l&apos;onglet, sans être envoyée
            tant que l&apos;utilisateur ne lance pas l&apos;estimation.
          </li>
        </ul>
        <p>
          Ces données ne sont ni vendues ni utilisées à des fins publicitaires. Le détail des traitements, des
          prestataires et de tes droits figure dans la{" "}
          <Link href="/confidentialite" className="font-medium text-link hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </Section>

      <Section n={10} id="responsabilite" title="Responsabilité et disponibilité">
        <ul>
          <li>
            decksell s&apos;efforce de fournir des informations à jour, sans pouvoir garantir l&apos;exactitude de
            chaque prix ni l&apos;absence d&apos;erreur dans les données transmises par des tiers.
          </li>
          <li>
            Le site peut être interrompu pour maintenance ou en cas de problème technique, sans que cela ouvre droit
            à indemnisation.
          </li>
          <li>
            decksell n&apos;est pas responsable des ventes conclues entre membres, ni de l&apos;état, de
            l&apos;authenticité ou de la livraison des cartes vendues.
          </li>
        </ul>
      </Section>

      <Section n={11} id="modification" title="Modification des conditions">
        <p>
          Ces conditions peuvent évoluer avec le site. La date de dernière mise à jour figure en haut de la page.
          En cas de changement important, les membres en seront informés.
        </p>
      </Section>

      <Section n={12} id="droit" title="Droit applicable">
        <p>
          Ces conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en
          priorité. À défaut, les tribunaux français seront compétents, sous réserve des règles protectrices
          applicables aux consommateurs.
        </p>
      </Section>

      <p className="border-t border-line pt-6 text-sm text-muted">
        Une question sur ces conditions ? Découvre aussi{" "}
        <Link href="/qui-sommes-nous" className="font-medium text-link hover:underline">
          qui est derrière decksell
        </Link>{" "}
        et d&apos;où viennent ses données.
      </p>
    </LegalPage>
  );
}

