import type { Metadata } from "next";
import { Suspense } from "react";
import { EspaceTabs } from "@/components/espace-tabs";
import { signOut } from "@/app/auth-actions";
import { getUnreadCount } from "@/lib/messaging";
import { isAdmin, isSuspendedNow, openReportCount } from "@/lib/moderation";
import { getUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase-auth";

// Espace membre : privé, jamais dans les résultats de recherche.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function EspaceLayout({ children }: LayoutProps<"/espace">) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl sm:text-4xl">Mon espace</h1>
          <p className="mt-1 text-muted">Tes decks en vente, tes messages, tes favoris et ton profil.</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-sunken hover:text-foreground">
            Se déconnecter
          </button>
        </form>
      </div>
      {/* Les onglets lisent l'adresse : à part, pour les pages à adresse variable. */}
      <Suspense fallback={<div className="h-[42px] border-b border-line" />}>
        <TabsWithUnread />
      </Suspense>
      <Suspense fallback={null}>
        <SuspendedNotice />
      </Suspense>
      <div className="pt-6">{children}</div>
    </main>
  );
}

async function TabsWithUnread() {
  const [unread, admin] = await Promise.all([getUnreadCount(), isAdmin()]);
  return <EspaceTabs unread={unread} moderation={admin ? { open: await openReportCount() } : undefined} />;
}

/** Compte suspendu par la modération : prévenu en haut de chaque page de l'espace. */
async function SuspendedNotice() {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createSupabaseServer();
  // Colonne absente tant que le schéma n'est pas à jour : rien n'est affiché.
  const { data } = await supabase.from("profiles").select("suspended_until").eq("id", user.id).maybeSingle();
  if (!isSuspendedNow(data?.suspended_until ?? null)) return null;
  const until = new Date(data!.suspended_until);
  return (
    <p role="alert" className="mt-4 rounded-lg border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger">
      <strong className="font-semibold">Ton compte est suspendu jusqu&apos;au{" "}
      {until.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.</strong> Tu ne peux plus
      envoyer de message ni modifier tes annonces, et elles ne sont plus visibles. Pour contester, réponds à l&apos;email de
      la modération.
    </p>
  );
}
