import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { fetchPublicListings } from "@/lib/public-listings";
import type { DeckFormat, PublicListing } from "@/lib/listings";
import { catalogPath } from "@/lib/deck-index";

// Les deux portes de l'accueil, de même poids : une par format, avec son critère phare.
// Illustration fixe par format, choisie par l'équipe (Scryfall, art crop) ; l'illustrateur est crédité.
const DOORS: Record<
  DeckFormat,
  { tagline: string; points: string[]; cta: string; ring: string; text: string; art: string; credit: string }
> = {
  modern: {
    art: "https://cards.scryfall.io/art_crop/front/b/c/bc95af55-d1dd-4fe6-adb0-3ad6db20d986.jpg?1783911293",
    credit: "Consign to Memory, par Ben Hill",
    tagline: "Des decks de tournoi, 60 cartes et leur réserve.",
    points: [
      "MetaScore : la liste comparée aux listes de tournoi récentes",
      "Archétypes du méta : Murktide, Boros Energy, Amulet Titan…",
    ],
    cta: "Voir les decks Modern",
    ring: "hover:border-link/60",
    text: "text-link",
  },
  commander: {
    art: "https://cards.scryfall.io/art_crop/front/1/0/10d42b35-844f-4a64-9981-c6118d45e826.jpg?1783915607",
    credit: "The Ur-Dragon, par Jaime Jones",
    tagline: "Des decks de 100 cartes, menés par leur commandant.",
    points: [
      "Niveau de puissance de 1 à 5, selon les règles officielles",
      "Commandant, couleurs et archétype : Voltron, Aristocrats, Jetons…",
    ],
    cta: "Voir les decks Commander",
    ring: "hover:border-commander/60",
    text: "text-commander",
  },
};

/** Les deux formats côte à côte, avec leur illustration et le nombre de decks en vente. */
export async function FormatDoors() {
  // Hors du try : ce signal de Next (lecture au moment de la requête) ne doit pas être intercepté.
  await connection();
  let listings: PublicListing[] = [];
  try {
    listings = await fetchPublicListings();
  } catch (e) {
    console.error("Accueil : formats indisponibles", e);
  }
  return <FormatDoorsView listings={listings} />;
}

export function FormatDoorsView({ listings }: { listings: PublicListing[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16">
      <h2 className="display text-2xl sm:text-3xl">Deux formats, une même règle de prix</h2>
      <p className="mt-1 text-muted">Chaque deck est estimé carte par carte d&apos;après Cardmarket, quel que soit son format.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {(["modern", "commander"] as DeckFormat[]).map((format) => (
          <Door key={format} format={format} listings={listings.filter((l) => l.format === format)} />
        ))}
      </div>
    </section>
  );
}

function Door({ format, listings }: { format: DeckFormat; listings: PublicListing[] }) {
  const door = DOORS[format];
  const onSale = listings.filter((l) => l.status === "active").length;
  return (
    <Link
      href={catalogPath(format)}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:shadow-lg ${door.ring}`}
    >
      <div className="relative aspect-[16/7] overflow-hidden bg-banner">
        <Image
            src={door.art}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 768px) 560px, 100vw"
            className="object-cover object-[50%_30%] opacity-80 transition duration-500 group-hover:scale-[1.04]"
          />
        <div className="absolute inset-0 bg-gradient-to-t from-banner via-banner/50 to-transparent" />
        <p className="absolute right-3 top-2.5 text-[11px] text-white/75 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
          Illustration : {door.credit}
        </p>
        <p className="display absolute bottom-4 left-5 right-5 text-3xl text-banner-ink sm:text-4xl">
          {format === "modern" ? "Modern" : "Commander"}
        </p>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="font-medium">{door.tagline}</p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted">
          {door.points.map((p) => (
            <li key={p} className="flex gap-2">
              <span aria-hidden className={`mt-[7px] size-1.5 shrink-0 rounded-full ${format === "modern" ? "bg-link" : "bg-commander"}`} />
              {p}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <span className="text-sm tabular-nums text-muted">
            {onSale === 0 ? "Bientôt des decks" : `${onSale} deck${onSale > 1 ? "s" : ""} en vente`}
          </span>
          <span className={`font-semibold group-hover:underline ${door.text}`}>{door.cta} →</span>
        </div>
      </div>
    </Link>
  );
}

/** Pendant la lecture des annonces : deux portes vides de même taille. */
export function FormatDoorsSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16" aria-busy>
      <div className="h-8 w-80 max-w-full animate-pulse rounded-lg bg-sunken" />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-sunken" />
        ))}
      </div>
    </section>
  );
}
