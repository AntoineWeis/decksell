// Illustrations originales de la page « Qui sommes-nous ».
// Dessinées pour decksell : aucune illustration, symbole ou cadre de carte de Wizards of the Coast.
// Couleurs tirées des variables du thème, pour suivre le mode clair ou sombre.

// Cinq teintes simples (pas les symboles de mana), pour évoquer les couleurs d'un deck.
const HUES = ["#f3ead2", "#3b82f6", "#3a3f4b", "#ef4444", "#22a55a"];

/** Un éventail de cartes stylisées qui se résume en un prix. */
export function DeckFanArt({ className = "" }: { className?: string }) {
  const cards = [-24, -12, 0, 12, 24];
  return (
    <svg viewBox="0 0 420 300" className={className} role="img" aria-label="Un éventail de cartes qui se résume en un prix total">
      <defs>
        <filter id="about-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>
      <g transform="translate(210 230)">
        {cards.map((angle, i) => (
          <g key={angle} transform={`rotate(${angle}) translate(-55 -190)`} filter="url(#about-shadow)">
            <rect width="110" height="154" rx="9" fill="#1b2438" stroke="#2c3956" strokeWidth="1.5" />
            <rect x="8" y="8" width="94" height="20" rx="4" fill="#24304a" />
            <circle cx="92" cy="18" r="5.5" fill={HUES[i]} />
            <rect x="8" y="34" width="94" height="62" rx="4" fill={HUES[i]} opacity="0.22" />
            <path d={`M8 ${96 - 12 - i * 4} L40 ${70 - i * 3} L62 ${84 - i * 2} L102 ${58 + i * 2} V96 H8 Z`} fill={HUES[i]} opacity="0.35" />
            <rect x="12" y="106" width="64" height="5" rx="2.5" fill="#3a4866" />
            <rect x="12" y="117" width="80" height="5" rx="2.5" fill="#3a4866" />
            <rect x="12" y="128" width="52" height="5" rx="2.5" fill="#3a4866" />
          </g>
        ))}
      </g>
      {/* Étiquette de prix : le deck entier devient un seul montant */}
      <g transform="translate(236 196)" filter="url(#about-shadow)">
        <rect width="168" height="64" rx="12" fill="var(--accent)" />
        <circle cx="20" cy="32" r="5" fill="#fff" opacity="0.9" />
        <text x="36" y="27" fill="#fff" opacity="0.85" fontSize="12" fontFamily="var(--font-geist-sans)">
          Valeur du deck
        </text>
        <text x="36" y="49" fill="#fff" fontSize="20" fontWeight="700" fontFamily="var(--font-sora)">
          Un seul prix
        </text>
      </g>
    </svg>
  );
}

/** Une deck box ouverte, ses 75 cartes rangées. */
export function DeckBoxArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 260" className={className} role="img" aria-label="Une deck box contenant un deck complet de 75 cartes">
      {/* cartes qui dépassent de la boîte */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x={92 + i * 4}
          y={40 - (i % 3) * 6}
          width="120"
          height="150"
          rx="7"
          fill={i === 5 ? "var(--surface)" : "var(--sunken)"}
          stroke="var(--line)"
          strokeWidth="1.5"
        />
      ))}
      <rect x="104" y="52" width="108" height="16" rx="3" fill="var(--brand-soft)" />
      <circle cx="200" cy="60" r="4.5" fill="var(--accent)" />
      {/* la boîte */}
      <path d="M70 110 H250 V226 a10 10 0 0 1 -10 10 H80 a10 10 0 0 1 -10 -10 Z" fill="var(--banner)" stroke="var(--accent)" strokeOpacity="0.45" strokeWidth="1.5" />
      <path d="M70 110 H250 L238 96 H82 Z" fill="var(--accent)" opacity="0.85" />
      <rect x="110" y="150" width="100" height="48" rx="8" fill="#ffffff" opacity="0.08" />
      <text x="160" y="182" textAnchor="middle" fill="var(--banner-ink)" fontSize="24" fontWeight="700" fontFamily="var(--font-sora)">
        75
      </text>
      <text x="160" y="212" textAnchor="middle" fill="var(--banner-muted)" fontSize="11" fontFamily="var(--font-geist-sans)">
        60 + 15 en réserve
      </text>
    </svg>
  );
}

/** Le trajet d'un prix : Cardmarket, puis Scryfall, puis decksell. */
export function DataFlowArt({ className = "" }: { className?: string }) {
  const steps = [
    { x: 10, title: "Cardmarket", sub: "Prix en euros" },
    { x: 230, title: "Scryfall", sub: "Données des cartes" },
    { x: 450, title: "decksell", sub: "Estimation datée", accent: true },
  ];
  return (
    <svg viewBox="0 0 640 150" className={className} role="img" aria-label="Les prix viennent de Cardmarket, passent par Scryfall, puis sont utilisés par decksell">
      <defs>
        <marker id="about-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill="var(--muted)" />
        </marker>
      </defs>
      {[200, 420].map((x) => (
        <line key={x} x1={x} y1="75" x2={x + 26} y2="75" stroke="var(--muted)" strokeWidth="2" markerEnd="url(#about-arrow)" />
      ))}
      {steps.map((s) => (
        <g key={s.title} transform={`translate(${s.x} 25)`}>
          <rect
            width="180"
            height="100"
            rx="14"
            fill={s.accent ? "var(--accent)" : "var(--surface)"}
            stroke={s.accent ? "none" : "var(--line)"}
            strokeWidth="1.5"
          />
          <text x="90" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fontFamily="var(--font-sora)" fill={s.accent ? "#fff" : "var(--foreground)"}>
            {s.title}
          </text>
          <text x="90" y="70" textAnchor="middle" fontSize="12.5" fontFamily="var(--font-geist-sans)" fill={s.accent ? "#fff" : "var(--muted)"} opacity={s.accent ? 0.85 : 1}>
            {s.sub}
          </text>
        </g>
      ))}
    </svg>
  );
}
