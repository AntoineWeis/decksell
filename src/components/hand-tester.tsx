"use client";

import { useState } from "react";
import { Modal } from "./modal";

/** Un exemplaire du deck principal. */
export type HandCard = { name: string; imageUrl: string | null; land: boolean };

type Drawn = HandCard & { uid: number };
type State = { library: Drawn[]; hand: Drawn[]; mulligans: number; toBottom: number; drawn: number; deal: number };

/** Mélange équitable (Fisher-Yates) avec le hasard cryptographique du navigateur. */
function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  const r = new Uint32Array(a.length);
  crypto.getRandomValues(r);
  for (let i = a.length - 1; i > 0; i--) {
    const j = r[i] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deal(deck: HandCard[], mulligans: number, previous = 0): State {
  const library = shuffle(deck.map((c, uid) => ({ ...c, uid })));
  return { hand: library.slice(0, 7), library: library.slice(7), mulligans, toBottom: mulligans, drawn: 0, deal: previous + 1 };
}

/**
 * Testeur de main : tire 7 cartes du deck principal mélangé. Mulligan à la londonienne (on repioche
 * 7 cartes, puis on en met une en dessous par mulligan, en cliquant dessus), pioche carte par carte.
 */
export function HandTester({ cards }: { cards: HandCard[] }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State | null>(null);
  if (cards.length < 7) return null;

  const start = () => {
    setState(deal(cards, 0));
    setOpen(true);
  };
  const s = state;
  const lands = s ? s.hand.filter((c) => c.land).length : 0;

  const putBottom = (uid: number) =>
    setState((st) => {
      if (!st || st.toBottom === 0) return st;
      const card = st.hand.find((c) => c.uid === uid)!;
      return { ...st, hand: st.hand.filter((c) => c.uid !== uid), library: [...st.library, card], toBottom: st.toBottom - 1 };
    });
  const draw = () =>
    setState((st) => (st && st.library.length && st.toBottom === 0 ? { ...st, hand: [...st.hand, st.library[0]], library: st.library.slice(1), drawn: st.drawn + 1 } : st));

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-sm font-medium text-muted transition hover:border-link/50 hover:text-link"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
          <rect x="3" y="6" width="9" height="13" rx="1.5" transform="rotate(-8 7.5 12.5)" />
          <rect x="11" y="5" width="9" height="13" rx="1.5" transform="rotate(8 15.5 11.5)" />
        </svg>
        Tester une main
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tester une main"
        size="xl"
        subtitle={
          s && (
            <>
              {s.mulligans > 0 ? `Mulligan à ${7 - s.mulligans}` : "Main de départ"} · {s.hand.length} carte{s.hand.length > 1 ? "s" : ""} ·{" "}
              {lands} terrain{lands > 1 ? "s" : ""} · {s.library.length} dans la bibliothèque
              {s.drawn > 0 && ` · ${s.drawn} pioche${s.drawn > 1 ? "s" : ""}`}
            </>
          )
        }
      >
        {s && (
          <>
            {s.toBottom > 0 && (
              <p className="mb-3 rounded-lg bg-brand-soft px-3 py-2 text-sm text-link" role="status">
                Choisis {s.toBottom} carte{s.toBottom > 1 ? "s" : ""} à mettre sous la bibliothèque : clique dessus.
              </p>
            )}
            <ul key={s.deal} className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {s.hand.map((c, i) => (
                <li key={c.uid} className="flip-in" style={{ animationDelay: `${Math.min(i, 7) * 60}ms` }}>
                  <button
                    type="button"
                    onClick={() => putBottom(c.uid)}
                    disabled={s.toBottom === 0}
                    aria-label={s.toBottom > 0 ? `Mettre ${c.name} en dessous` : c.name}
                    className={`block w-full rounded-[4.75%/3.5%] transition enabled:cursor-pointer enabled:hover:-translate-y-1 enabled:hover:ring-2 enabled:hover:ring-link disabled:cursor-default`}
                  >
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- image Scryfall telle quelle
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        width={488}
                        height={680}
                        className="aspect-[488/680] w-full rounded-[4.75%/3.5%] bg-sunken shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6)]"
                      />
                    ) : (
                      <span className="flex aspect-[488/680] w-full items-center justify-center rounded-[4.75%/3.5%] bg-sunken p-2 text-center text-xs text-muted">
                        {c.name}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setState(deal(cards, 0, s.deal))}
                className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
              >
                Nouvelle main
              </button>
              <button
                type="button"
                onClick={() => setState(deal(cards, s.mulligans + 1, s.deal))}
                disabled={s.mulligans >= 6}
                className="h-10 rounded-lg border border-line px-4 text-sm font-medium transition hover:border-link/50 hover:text-link disabled:opacity-50"
              >
                Mulligan
              </button>
              <button
                type="button"
                onClick={draw}
                disabled={s.toBottom > 0 || s.library.length === 0}
                className="h-10 rounded-lg border border-line px-4 text-sm font-medium transition hover:border-link/50 hover:text-link disabled:opacity-50"
              >
                Piocher une carte
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
