"use client";

import { useEffect, useRef } from "react";

/**
 * Fenêtre modale du site (balise <dialog> du navigateur) : Échap ou clic à côté pour fermer,
 * focus gardé dans la fenêtre. Ouverte et fermée par le parent (open / onClose).
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "lg",
  onKeyDown,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
  onKeyDown?: (e: React.KeyboardEvent<HTMLDialogElement>) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const width = { md: "w-[min(36rem,calc(100vw-2rem))]", lg: "w-[min(56rem,calc(100vw-2rem))]", xl: "w-[min(72rem,calc(100vw-2rem))]" }[size];
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className={`m-auto ${width} max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-[2px]`}
    >
      {open && (
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="display text-xl sm:text-2xl">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Fermer"
              className="-mr-1 -mt-1 shrink-0 rounded-full p-2 text-muted ring-1 ring-line transition hover:bg-sunken hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
