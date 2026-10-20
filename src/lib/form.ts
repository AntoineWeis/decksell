import { startTransition, type FormEvent } from "react";

/**
 * Envoie un formulaire à une action sans le vider ensuite.
 * (Avec `<form action>`, React remet les champs à zéro après chaque envoi,
 * ce qui ferait perdre la saisie en cas d'erreur.)
 */
export function submitWithoutReset(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
}
