"use client";

import { useState } from "react";
import type { MessageResult } from "@/app/espace/messages/actions";
import { MessageComposer } from "./message-composer";

/** Bouton « Contacter le vendeur » qui s'ouvre sur un premier message pré-rempli. */
export function ContactForm({
  action,
  suggestion,
}: {
  action: (formData: FormData) => Promise<MessageResult>;
  suggestion: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-accent px-4 font-semibold text-on-accent transition hover:bg-accent-hover"
      >
        Contacter le vendeur
      </button>
    );
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="mb-2 text-sm font-medium">Ton message au vendeur</p>
      <MessageComposer
        action={action}
        defaultValue={suggestion}
        label="Ton message au vendeur"
        rows={4}
        autoFocus
        onCancel={() => setOpen(false)}
      />
      <p className="mt-2 text-xs text-muted">Ton adresse email n&apos;est pas transmise au vendeur.</p>
    </div>
  );
}
