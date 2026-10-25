"use client";

import { useEffect, useRef } from "react";

/**
 * À poser dans un formulaire GET : il s'envoie dès qu'un menu, une case ou un prix change
 * (pas besoin de bouton « Appliquer »). Le champ de recherche texte, lui, s'envoie avec Entrée.
 * Les champs vides sont retirés de l'adresse (pas de « ?min=&max= »).
 */
export function AutoSubmit() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;
    const onChange = (e: Event) => {
      const el = e.target as HTMLInputElement;
      if (el.type === "search" || el.type === "text") return;
      form.requestSubmit();
    };
    // Avant l'envoi (phase de capture, avant le gestionnaire de Next) : on désactive les champs vides.
    const onSubmit = () => {
      const empty = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[name], select[name]")].filter(
        (el) => !el.disabled && el.value === "" && el.type !== "checkbox",
      );
      empty.forEach((el) => (el.disabled = true));
      window.setTimeout(() => empty.forEach((el) => (el.disabled = false)), 0);
    };
    form.addEventListener("change", onChange);
    form.addEventListener("submit", onSubmit, true);
    return () => {
      form.removeEventListener("change", onChange);
      form.removeEventListener("submit", onSubmit, true);
    };
  }, []);
  return <span ref={anchor} hidden />;
}
