"use server";

import { redirect } from "next/navigation";
import { DELETE_WORD } from "@/lib/account";
import { getUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export type DeleteState = { status: "idle" } | { status: "error"; message: string };

/**
 * Supprime définitivement le compte du membre connecté :
 * photos de profil, puis le compte (le profil et les annonces suivent en cascade).
 */
export async function deleteAccount(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const user = await getUser();
  if (!user) return { status: "error", message: "Ta session a expiré. Reconnecte-toi." };

  const typed = String(formData.get("confirm") ?? "").trim().toUpperCase();
  if (typed !== DELETE_WORD) {
    return { status: "error", message: `Recopie ${DELETE_WORD} pour confirmer.` };
  }

  const admin = getSupabaseAdmin();

  // 1. Photos de profil : elles ne sont pas liées au compte, on les retire à la main.
  const bucket = admin.storage.from("avatars");
  const { data: files, error: listError } = await bucket.list(user.id, { limit: 1000 });
  if (listError) {
    console.error("Suppression du compte : lecture des photos impossible", listError.message);
    return { status: "error", message: "La suppression a échoué. Réessaie dans un instant." };
  }
  if (files?.length) {
    const { error } = await bucket.remove(files.map((f) => `${user.id}/${f.name}`));
    if (error) {
      console.error("Suppression du compte : photos non supprimées", error.message);
      return { status: "error", message: "La suppression a échoué. Réessaie dans un instant." };
    }
  }

  // 2. Le compte : profil et annonces sont supprimés en cascade par la base.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Suppression du compte impossible", error.message);
    return { status: "error", message: "La suppression a échoué. Réessaie dans un instant." };
  }

  // 3. Efface la session de ce navigateur.
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut({ scope: "local" });

  redirect("/compte-supprime");
}
