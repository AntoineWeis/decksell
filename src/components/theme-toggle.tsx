"use client";

// Bouton clair / sombre de l'en-tête. Le choix est gardé dans le navigateur (localStorage) et
// posé sur <html data-theme> ; sans choix, le thème du système s'applique. Les icônes sont
// affichées par le CSS (.when-dark / .when-light) : aucun écart entre serveur et navigateur.

export const THEME_KEY = "decksell:theme";

/** Script exécuté avant l'affichage (layout.tsx) : applique le thème choisi, sans flash. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;

function currentTheme(): "light" | "dark" {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * header : icône seule dans l'en-tête (masquée sur mobile, faute de place) ;
 * footer : icône et libellé dans le pied de page, pour le mobile.
 */
export function ThemeToggle({ variant = "header" }: { variant?: "header" | "footer" }) {
  const toggle = () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Stockage indisponible (navigation privée) : le thème vaut pour cette page seulement.
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Changer de thème (clair ou sombre)"
      title="Thème clair ou sombre"
      className={
        variant === "header"
          ? "hidden h-9 w-9 shrink-0 items-center justify-center rounded-md text-banner-muted transition hover:bg-white/10 hover:text-banner-ink sm:flex"
          : "inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground sm:hidden"
      }
    >
      {/* Soleil en thème sombre (passer au clair), lune en thème clair (passer au sombre). */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="when-dark size-[19px]" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="when-light size-[19px]" aria-hidden>
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
      {variant === "footer" && (
        <>
          <span className="when-dark">Passer en thème clair</span>
          <span className="when-light">Passer en thème sombre</span>
        </>
      )}
    </button>
  );
}
