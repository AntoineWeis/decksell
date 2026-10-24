import { useId } from "react";
import { FLASK_BODY, FLASK_CORK, FLASK_LIQUID, FLASK_LIQUID_CLIP, FLASK_NECK, FLASK_RIM, FLASK_TILT, LOGO_COLORS } from "@/lib/logo";

/** Fiole du logo qui se remplit en boucle, avec deux bulles : l'attente aux couleurs du site. */
export function LoadingFlask({ size = 44, className = "" }: { size?: number; className?: string }) {
  const id = useId();
  const gradient = `lf-g-${id}`;
  const clip = `lf-c-${id}`;
  const c = FLASK_LIQUID_CLIP;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={LOGO_COLORS.from} />
          <stop offset="1" stopColor={LOGO_COLORS.to} />
        </linearGradient>
        <clipPath id={clip}>
          <circle cx={c.cx} cy={c.cy} r={c.r} />
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
      <g clipPath={`url(#${clip})`}>
        <path className="flask-liquid" d={FLASK_LIQUID} fill={`url(#${gradient})`} />
        <circle className="flask-bubble" cx="12.5" cy="23" r="1.1" fill="#fff" />
        <circle className="flask-bubble" style={{ animationDelay: "700ms" }} cx="16.5" cy="24.5" r="0.8" fill="#fff" />
      </g>
    </svg>
  );
}
