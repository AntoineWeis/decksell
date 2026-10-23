import Image from "next/image";
import Link from "next/link";
import { artCrop } from "@/lib/listings";
import { FormatTag } from "./format-tag";

/** Bandeau de page de deck : illustration de la carte phare floutée sous un dégradé. */
export function DeckBanner({
  title,
  coverImageUrl,
  coverCardName,
  back,
  format,
  children,
}: {
  title: string;
  /** Format de jeu, affiché en tag à côté du nom. */
  format?: unknown;
  coverImageUrl: string | null;
  coverCardName: string | null;
  back: { href: string; label: string };
  children?: React.ReactNode;
}) {
  const art = artCrop(coverImageUrl);
  return (
    <section className="relative overflow-hidden bg-banner text-banner-ink">
      {art && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image src={art} alt="" fill preload unoptimized sizes="100vw" className="scale-110 object-cover object-center opacity-70 blur-[6px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-banner via-banner/80 to-banner/10" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-banner to-transparent" />
        </div>
      )}
      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-10">
        <Link href={back.href} className="text-sm font-medium text-banner-muted hover:text-banner-ink">
          ← {back.label}
        </Link>
        <h1 className="display mt-4 max-w-3xl text-3xl sm:text-5xl">
          {title}
          {format !== undefined && <FormatTag format={format} onDark className="ml-3 -translate-y-1 sm:-translate-y-2 sm:text-xs" />}
        </h1>
        {children}
        {coverCardName && <p className="mt-6 text-[11px] text-banner-muted/80">Illustration : {coverCardName}</p>}
      </div>
    </section>
  );
}
