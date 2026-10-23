"use client";

import { useEffect, useRef } from "react";

// Particules de mana qui montent du bas du bandeau d'accueil. Canvas 2D, aucune librairie.
// Chaque particule est une petite lueur (sprite pré-dessiné, donc peu coûteux) dans des teintes
// de bleu à violet ; elle monte en ondulant, scintille et s'éteint avant d'atteindre le haut.
// Discret et léger : ~1 particule pour 20 px de large (18 à 64), 30 images/s au plus, pause hors écran
// et onglet caché, rien du tout si l'on préfère moins d'animations.

const FPS = 30;
// Du bleu ciel au violet.
const MANA = ["#9cc8ff", "#5f9dff", "#7c86ff", "#9d84ff", "#bfa2ff"];
const OPACITY = 0.55; // plafond d'opacité : l'effet reste en arrière-plan

type Particle = {
  x: number;
  y: number;
  speed: number; // px par seconde
  size: number; // diamètre de la lueur, px
  sway: number; // amplitude de l'ondulation, px
  phase: number;
  life: number; // 0 → 1
  span: number; // part de la hauteur parcourue avant de s'éteindre
  color: number;
};

/** Lueur ronde d'une couleur, dessinée une fois puis réutilisée. */
function glow(color: string): HTMLCanvasElement {
  const s = 32;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, "rgba(232,238,255,0.95)"); // cœur bleuté, jamais blanc pur
  grad.addColorStop(0.18, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return c;
}

export function ManaRise({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sprites = MANA.map(glow);
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let last = 0;
    let visible = true;

    // Plus dense à droite : à gauche, le texte doit rester bien lisible.
    const spawn = (p: Partial<Particle> = {}): Particle => ({
      x: w * (0.08 + 0.92 * Math.sqrt(Math.random())),
      y: h + 10,
      speed: 18 + Math.random() * 38,
      size: 6 + Math.random() * 9,
      sway: 6 + Math.random() * 18,
      phase: Math.random() * Math.PI * 2,
      life: 0,
      span: 0.3 + Math.random() * 0.55,
      color: (Math.random() * MANA.length) | 0,
      ...p,
    });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(18, Math.min(64, Math.round(w / 20)));
      // Au chargement, les particules sont déjà en route (pas de vague partant du bas d'un coup).
      particles = Array.from({ length: count }, () => {
        const p = spawn();
        p.life = Math.random();
        p.y = h - p.life * p.span * h;
        return p;
      });
    }

    function step(dt: number, t: number) {
      ctx!.clearRect(0, 0, w, h);
      ctx!.globalCompositeOperation = "lighter"; // les lueurs s'additionnent comme de la lumière
      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.y -= p.speed * dt;
        p.life = (h - p.y) / (p.span * h);
        if (p.life >= 1) p = particles[i] = spawn();
        // S'allume vite au ras du sol, puis s'éteint lentement en montant, avec un léger scintillement.
        const life = Math.min(1, Math.max(0, p.life));
        const fade = life < 0.12 ? life / 0.12 : Math.pow(1 - (life - 0.12) / 0.88, 1.4);
        const twinkle = 0.75 + 0.25 * Math.sin(t * 0.004 + p.phase * 3);
        ctx!.globalAlpha = fade * twinkle * OPACITY;
        const x = p.x + Math.sin(t * 0.0012 + p.phase) * p.sway;
        const s = p.size * (0.7 + 0.3 * fade);
        ctx!.drawImage(sprites[p.color], x - s / 2, p.y - s / 2, s, s);
      }
      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = "source-over";
    }

    function frame(t: number) {
      raf = requestAnimationFrame(frame);
      if (last && t - last < 1000 / FPS) return;
      const dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
      last = t;
      step(dt, t);
    }

    function start() {
      if (raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    resize();
    start();

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${className}`} />;
}
