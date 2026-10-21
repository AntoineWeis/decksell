import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { formatEur } from "@/lib/pricing";
import { LISTING_COLUMNS, type Listing } from "@/lib/listings";
import { ListingCard } from "@/components/listing-card";
import { getArchetypes } from "@/lib/archetypes";

export const metadata: Metadata = { title: "Mes annonces" };

export default function ListingsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const user = await requireUser("/espace");
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("listings")
    .select(`${LISTING_COLUMNS}, sold_cents, sold_at`)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="rounded-xl bg-danger-soft px-5 py-4 text-danger">Impossible de charger tes annonces.</p>;
  }
  const listings = (data ?? []) as unknown as Listing[];
  const archetypes = await getArchetypes();

  const count = (s: Listing["status"]) => listings.filter((l) => l.status === s).length;
  const soldTotal = listings.reduce((n, l) => n + (l.status === "sold" ? (l.sold_cents ?? 0) : 0), 0);
  const onSaleValue = listings.reduce((n, l) => n + (l.status === "active" ? l.asking_cents : 0), 0);

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="En vente" value={String(count("active"))} hint={onSaleValue ? formatEur(onSaleValue) : undefined} />
        <Stat label="Réservés" value={String(count("reserved"))} />
        <Stat label="Vendus" value={String(count("sold"))} />
        <Stat label="Total encaissé" value={formatEur(soldTotal)} />
      </dl>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
          <p className="font-semibold">Aucune annonce pour l&apos;instant</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Estime un deck, puis clique sur « Mettre en vente » sous le résultat.
          </p>
          <Link
            href="/estimer"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-accent px-4 font-semibold text-on-accent hover:bg-accent-hover"
          >
            Estimer un deck
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} archetypes={archetypes} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-xl font-bold tabular-nums">{value}</dd>
      {hint && <dd className="text-xs tabular-nums text-muted">{hint} demandés</dd>}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-xl bg-sunken" />
        ))}
      </div>
      <div className="h-32 animate-pulse rounded-xl bg-sunken" />
    </div>
  );
}
