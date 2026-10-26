"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth";
import { GATE_COOKIE, GATE_MAX_AGE, gatePassword, gateToken } from "@/lib/site-gate";

export type GateState = { error: string | null };

export async function unlockSite(_prev: GateState, formData: FormData): Promise<GateState> {
  const expected = gatePassword();
  const next = safeNext(formData.get("next"), "/");
  if (!expected) redirect(next);

  const given = String(formData.get("password") ?? "");
  if (!given) return { error: "Entre le mot de passe." };
  // On compare les empreintes : même longueur, quel que soit ce qui a été tapé.
  if ((await gateToken(given)) !== (await gateToken(expected))) {
    return { error: "Mot de passe incorrect." };
  }

  (await cookies()).set(GATE_COOKIE, await gateToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GATE_MAX_AGE,
  });
  redirect(next);
}
