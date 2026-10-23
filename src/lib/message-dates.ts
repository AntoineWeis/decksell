// Dates de la messagerie, toujours à l'heure de Paris (le serveur tourne en UTC).

const TZ = "Europe/Paris";
const dayKey = (d: Date) => d.toLocaleDateString("fr-FR", { timeZone: TZ });

export const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

/** « 14:32 » aujourd'hui, « hier », sinon « 23 oct. ». */
export function shortDate(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (dayKey(d) === dayKey(now)) return timeOf(iso);
  if (dayKey(d) === dayKey(new Date(now.getTime() - 86_400_000))) return "hier";
  return d.toLocaleDateString("fr-FR", { timeZone: TZ, day: "numeric", month: "short" });
}

/** « Aujourd'hui », « Hier », sinon « jeudi 23 octobre ». */
export function dayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (dayKey(d) === dayKey(now)) return "Aujourd'hui";
  if (dayKey(d) === dayKey(new Date(now.getTime() - 86_400_000))) return "Hier";
  return d.toLocaleDateString("fr-FR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
}

/** Vrai si les deux dates tombent le même jour (heure de Paris). */
export const sameDay = (a: string, b: string) => dayKey(new Date(a)) === dayKey(new Date(b));
