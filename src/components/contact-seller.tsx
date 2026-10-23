import Link from "next/link";
import { getUser } from "@/lib/auth";
import { findConversationId } from "@/lib/messaging";
import { startConversation } from "@/app/espace/messages/actions";
import { ContactForm } from "./contact-form";

const buttonClass =
  "mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-accent px-4 font-semibold text-on-accent transition hover:bg-accent-hover";

/** Prise de contact sous le prix d'une annonce : selon que le visiteur est connecté, vendeur ou déjà en contact. */
export async function ContactSeller({ listingId, sellerId, title }: { listingId: string; sellerId: string | null; title: string }) {
  const user = await getUser();

  if (!user) {
    return (
      <>
        <Link href={`/connexion?next=${encodeURIComponent(`/decks/${listingId}`)}`} className={buttonClass}>
          Contacter le vendeur
        </Link>
        <p className="mt-2 text-center text-xs text-muted">Connecte-toi pour écrire au vendeur.</p>
      </>
    );
  }

  if (user.id === sellerId) {
    return (
      <Link
        href={`/espace/annonces/${listingId}`}
        className="mt-4 flex h-11 items-center justify-center rounded-xl border border-line text-sm font-medium transition hover:border-link/50 hover:text-link"
      >
        C&apos;est ton annonce : la gérer
      </Link>
    );
  }

  const existing = await findConversationId(listingId, user.id);
  if (existing) {
    return (
      <Link href={`/espace/messages/${existing}`} className={buttonClass}>
        Voir ma conversation avec le vendeur
      </Link>
    );
  }

  return (
    <ContactForm
      action={startConversation.bind(null, listingId)}
      suggestion={`Bonjour, ton deck « ${title} » est-il toujours disponible ?`}
    />
  );
}
