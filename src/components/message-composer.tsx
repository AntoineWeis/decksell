"use client";

import { useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { MESSAGE_MAX, containsContactInfo } from "@/lib/messaging-shared";
import type { MessageResult } from "@/app/espace/messages/actions";

const inputClass =
  "block w-full resize-y rounded-xl border border-line bg-sunken px-3 py-2.5 leading-relaxed outline-none focus:border-link focus:ring-2 focus:ring-link/25";

/** Zone de saisie d'un message. Le texte n'est effacé qu'une fois le message envoyé. */
export function MessageComposer({
  action,
  defaultValue = "",
  submitLabel = "Envoyer",
  placeholder = "Ton message…",
  label = "Ton message",
  autoFocus = false,
  rows = 3,
  onCancel,
}: {
  action: (formData: FormData) => Promise<MessageResult | void>;
  defaultValue?: string;
  submitLabel?: string;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
  rows?: number;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, startSend] = useTransition();
  const empty = value.trim() === "";
  const tooLong = value.length > MESSAGE_MAX;

  function send() {
    if (empty || tooLong || pending) return;
    const fd = new FormData();
    fd.set("body", value);
    startSend(async () => {
      const result = await action(fd);
      if (result?.status === "error") {
        setError(result.message);
      } else {
        setValue("");
        setError(null);
      }
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      send();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label className="block">
        <span className="sr-only">{label}</span>
        <textarea
          name="body"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={rows}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-invalid={tooLong || undefined}
          className={inputClass}
        />
      </label>
      {containsContactInfo(value) && (
        <p className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
          Ton message contient un email ou un numéro de téléphone. Garde l&apos;échange sur decksell tant que vous
          n&apos;êtes pas d&apos;accord sur la vente : c&apos;est ce qui permet de t&apos;aider en cas de problème.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`text-xs tabular-nums ${tooLong ? "font-semibold text-danger" : "text-muted"}`}>
          {value.length} / {MESSAGE_MAX}
          <span className="hidden sm:inline"> · Ctrl + Entrée pour envoyer</span>
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="h-10 rounded-xl px-3 text-sm font-medium text-muted hover:text-foreground">
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={empty || tooLong || pending}
            className="h-10 rounded-xl bg-accent px-4 font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-50"
          >
            {pending ? "Envoi…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
