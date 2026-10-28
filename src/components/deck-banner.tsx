import Image from "next/image";
import Link from "next/link";
import { artCrop, normalizeFormat } from "@/lib/listings";
import { FormatTag } from "./format-tag";

/**
 * Bandeau de page de deck : illustration de la carte phare floutée sous un dégradé. En Commander,
 * le commandant est l'image du deck : son illustration reste nette, à droite, pour qu'on le reconnaisse.
 */
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
  const commander = format !== undefined && normalizeFormat(format) === "commander";
  return (
    <section className="relative overflow-hidden bg-banner text-banner-ink">
      {art && commander && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-full sm:w-3/5">
          <Image src={art} alt="" fill preload unoptimized sizes="(min-width: 640px) 60vw, 100vw" className="object-cover object-[50%_25%] opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-banner via-banner/60 to-banner/0" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-banner to-transparent" />
          <div className="absolute inset-0 bg-banner/40 sm:bg-transparent" />
        </div>
      )}
      {art && !commander && (
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
        {coverCardName && (
          <p className="mt-6 text-[11px] text-banner-muted/80">
            {commander ? "Commandant" : "Illustration"} : {coverCardName}
          </p>
        )}
      </div>
    </section>
  );
}
