import { useId } from "react";
import {
  FLASK_BODY,
  FLASK_CORK,
  FLASK_LIQUID,
  FLASK_LIQUID_CLIP,
  FLASK_NECK,
  FLASK_RIM,
  FLASK_TILT,
  LOGO_COLORS,
  SPARKLE_BIG,
  SPARKLE_SMALL,
} from "@/lib/logo";

/** Symbole du logo : fiole de mana et étincelles (voir lib/logo.ts). Décoratif : le nom suit à côté. */
export function LogoMark({ size = 26, className = "" }: { size?: number; className?: string }) {
  const id = useId();
  const gradient = `logo-g-${id}`;
  const clip = `logo-c-${id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={LOGO_COLORS.from} />
          <stop offset="1" stopColor={LOGO_COLORS.to} />
        </linearGradient>
        <clipPath id={clip}>
          <circle cx={FLASK_LIQUID_CLIP.cx} cy={FLASK_LIQUID_CLIP.cy} r={FLASK_LIQUID_CLIP.r} />
        </clipPath>
      </defs>
      <g transform={FLASK_TILT}>
        <g fill="none" stroke={`url(#${gradient})`} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d={FLASK_BODY} />
          <path d={FLASK_NECK} />
          <path d={FLASK_RIM} />
        </g>
        <path d={FLASK_CORK} fill={`url(#${gradient})`} />
      </g>
      <path d={FLASK_LIQUID} fill={`url(#${gradient})`} clipPath={`url(#${clip})`} />
      <path d={SPARKLE_BIG} fill={`url(#${gradient})`} />
      <path d={SPARKLE_SMALL} fill={LOGO_COLORS.to} />
    </svg>
  );
}
