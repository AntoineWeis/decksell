import { EspaceTabs } from "@/components/espace-tabs";
import { signOut } from "@/app/auth-actions";

export default function EspaceLayout({ children }: LayoutProps<"/espace">) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mon espace</h1>
          <p className="mt-1 text-muted">Tes decks en vente et ton profil.</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-sunken hover:text-foreground">
            Se déconnecter
          </button>
        </form>
      </div>
      <EspaceTabs />
      <div className="pt-6">{children}</div>
    </main>
  );
}
