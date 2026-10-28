import type { Metadata } from "next";
import { LegalPage, LegalSection as Section } from "@/components/legal";
import { EDITOR } from "@/lib/editor";

export const metadata: Metadata = {
  title: "Accessibilité",
  description:
    "Déclaration d'accessibilité de decksell : objectif WCAG 2.2 niveau AA, état de conformité, mesures en place, limites connues et contact.",
  alternates: { canonical: "/accessibilite" },
};

const UPDATED = "28 octobre 2026";

const SECTIONS = [
  { id: "engagement", title: "Notre engagement" },
  { id: "conformite", title: "État de conformité" },
  { id: "mesures", title: "Ce qui est en place" },
  { id: "limites", title: "Limites connues" },
  { id: "verification", title: "Comment le site est vérifié" },
  { id: "contact", title: "Signaler un problème" },
];

const linkClass = "font-medium text-link hover:underline";

export default function AccessibilityPage() {
  return (
    <LegalPage
      title="Accessibilité"
      intro="decksell veut être utilisable par tous les joueurs, quels que soient leur équipement et leur façon de naviguer."
      updated={UPDATED}
      sections={SECTIONS}
    >
      <Section n={1} id="engagement" title="Notre engagement">
        <p>
          decksell vise la conformité aux{" "}
          <a href="https://www.w3.org/Translations/WCAG22-fr/" className={linkClass}>
            Règles pour l&apos;accessibilité des contenus Web (WCAG) 2.2
          </a>
          , au <strong>niveau AA</strong>, sur l&apos;ensemble du site : accueil, catalogues, fiches des decks,
          estimateur, espace membre et messagerie.
        </p>
      </Section>

      <Section n={2} id="conformite" title="État de conformité">
        <p>
          decksell est <strong>partiellement conforme</strong> aux WCAG 2.2 niveau AA. Aucun audit complet par un
          organisme indépendant n&apos;a encore été réalisé : cet état repose sur les vérifications décrites plus bas et
          sur les limites connues listées dans cette page.
        </p>
      </Section>

      <Section n={3} id="mesures" title="Ce qui est en place">
        <ul>
          <li>
            <strong>Structure</strong> : chaque page a un titre principal, des intertitres hiérarchisés et des zones
            identifiées (en-tête, navigation, contenu, pied de page). Un lien « Aller au contenu » permet de passer la
            navigation au clavier.
          </li>
          <li>
            <strong>Clavier</strong> : tout se fait au clavier, avec un contour de focus visible. Les fenêtres
            (photos, carte en grand, testeur de main) se ferment avec Échap ; les cartes en grand se parcourent avec
            les flèches.
          </li>
          <li>
            <strong>Couleurs et contrastes</strong> : textes contrastés en thème clair et en thème sombre, au choix
            ou selon ton appareil. La couleur n&apos;est jamais la seule information : les formats, niveaux, états et
            badges sont toujours écrits en toutes lettres.
          </li>
          <li>
            <strong>Texte</strong> : taille minimale de 11 px, pages lisibles avec un zoom à 200 % et sur petit écran,
            sans défilement horizontal.
          </li>
          <li>
            <strong>Alternatives textuelles</strong> : les graphiques (courbe de mana, types de cartes) ont un tableau
            équivalent pour les lecteurs d&apos;écran ; les icônes décoratives sont masquées ; les boutons sans texte ont
            un intitulé.
          </li>
          <li>
            <strong>Formulaires</strong> : chaque champ a une étiquette, et les erreurs sont expliquées en texte, avec
            ce qu&apos;il faut corriger.
          </li>
          <li>
            <strong>Animations</strong> : courtes et facultatives ; elles sont désactivées si ton appareil demande de
            réduire les animations.
          </li>
          <li>
            <strong>Langue</strong> : le site est déclaré en français, et ses textes sont écrits simplement.
          </li>
        </ul>
      </Section>

      <Section n={4} id="limites" title="Limites connues">
        <ul>
          <li>
            Les <strong>images des cartes</strong> viennent de Scryfall et n&apos;ont pas de description détaillée de
            leur illustration ou de leur texte de règles. Le nom de chaque carte est toujours écrit à côté.
          </li>
          <li>
            L&apos;<strong>aperçu agrandi d&apos;une carte au survol</strong> ne fonctionne qu&apos;à la souris ; la
            même carte s&apos;ouvre en grand par un clic ou au clavier.
          </li>
          <li>
            Le <strong>testeur de main</strong> et la <strong>messagerie</strong> n&apos;ont pas encore été testés avec
            tous les lecteurs d&apos;écran du marché.
          </li>
        </ul>
        <p>Ces points sont suivis et corrigés au fil des mises à jour du site.</p>
      </Section>

      <Section n={5} id="verification" title="Comment le site est vérifié">
        <ul>
          <li>Navigation complète au clavier, sans souris.</li>
          <li>Affichage vérifié sur ordinateur, tablette et mobile, en thème clair et en thème sombre.</li>
          <li>Contrôles automatiques du code de l&apos;interface (contrastes, tailles de texte, images).</li>
        </ul>
        <p>Technologies utilisées : HTML, CSS et JavaScript.</p>
      </Section>

      <Section n={6} id="contact" title="Signaler un problème">
        <p>
          Une page, un bouton ou un contenu t&apos;est inaccessible ? Écris à{" "}
          <a href={`mailto:${EDITOR.email}?subject=${encodeURIComponent("Accessibilité")}`} className={linkClass}>
            {EDITOR.email}
          </a>{" "}
          en précisant la page et ce qui bloque. Nous te répondrons, et te proposerons si besoin un autre moyen
          d&apos;accéder à l&apos;information.
        </p>
      </Section>
    </LegalPage>
  );
}
