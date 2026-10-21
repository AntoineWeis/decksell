import Image from "next/image";

/** Photo de profil, ou initiales sur fond coloré. */
export function Avatar({ name, url, size = 32 }: { name: string; url: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft font-semibold text-link"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {url ? <Image src={url} alt="" fill sizes={`${size}px`} unoptimized className="object-cover" /> : initials}
    </span>
  );
}
