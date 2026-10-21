"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { FLASH_COOKIE, rawFlash, readFlash } from "@/lib/flash-shared";

export type ToastKind = "success" | "error";
type Toast = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<(kind: ToastKind, message: string) => void>(() => {});

/** Affiche une notification : `toast("success", "Annonce publiée")`. */
export function useToast() {
  return useContext(ToastContext);
}

/**
 * Notifie le résultat d'un formulaire : appelle `onSuccess`/`onError` une fois par nouvel
 * état renvoyé par useActionState (chaque envoi crée un nouvel objet).
 */
export function useActionToast(
  state: { status: string; message?: string },
  messages: { success?: string; successStatus?: string; error?: boolean },
) {
  const toast = useToast();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (messages.success && state.status === (messages.successStatus ?? "saved")) toast("success", messages.success);
    else if (messages.error !== false && state.status === "error" && state.message) toast("error", state.message);
  }, [state, messages.success, messages.successStatus, messages.error, toast]);
}

const DURATION = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const toast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      // Au plus 4 à l'écran : les plus anciennes partent d'abord.
      setToasts((ts) => [...ts.slice(-3), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), kind === "error" ? DURATION * 1.6 : DURATION);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Deux zones annoncées aux lecteurs d'écran : polie pour les succès, immédiate pour les erreurs. */}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6">
        <div role="status" aria-live="polite" className="flex w-full flex-col items-end gap-2">
          {toasts.filter((t) => t.kind === "success").map((t) => (
            <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
          ))}
        </div>
        <div role="alert" aria-live="assertive" className="flex w-full flex-col items-end gap-2">
          {toasts.filter((t) => t.kind === "error").map((t) => (
            <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const ok = toast.kind === "success";
  return (
    <div
      className={`toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface px-4 py-3 text-sm shadow-lg ${
        ok ? "border-ok/40" : "border-danger/40"
      }`}
    >
      <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${ok ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-3" aria-hidden>
          {ok ? <path d="m5 12 4.5 4.5L19 7" /> : <path d="M12 7v6M12 17h.01" />}
        </svg>
      </span>
      <p className="min-w-0 flex-1 leading-snug">
        <span className="sr-only">{ok ? "Succès : " : "Erreur : "}</span>
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la notification"
        className="-mr-1 -mt-0.5 rounded-md p-1 text-muted hover:bg-sunken hover:text-foreground"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Notification laissée par une action serveur juste avant une redirection
 * (cookie de courte durée) : affichée à l'arrivée sur la nouvelle page, puis effacée.
 * À placer dans un <Suspense> (lit l'adresse courante).
 */
export function FlashToasts() {
  const pathname = usePathname();
  const toast = useToast();
  useEffect(() => {
    if (!rawFlash(document.cookie)) return;
    const flash = readFlash(document.cookie);
    // Effacé même s'il est illisible, pour ne pas le relire à chaque page.
    document.cookie = `${FLASH_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    if (flash) toast(flash.kind, flash.message);
  }, [pathname, toast]);
  return null;
}
