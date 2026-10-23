import type { Metadata } from "next";
import { Suspense } from "react";
import { getProfile, requireUser } from "@/lib/auth";
import { ProfileForm, type ProfilePrefs } from "@/components/profile-form";
import { DeleteAccount } from "@/components/delete-account";
import { createSupabaseServer } from "@/lib/supabase-auth";

export const metadata: Metadata = { title: "Profil" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-sunken" />}>
      <ProfileSection />
    </Suspense>
  );
}

async function ProfileSection() {
  const user = await requireUser("/espace/profil");
  const profile = await getProfile();
  if (!profile) {
    return <p className="rounded-2xl bg-danger-soft px-5 py-4 text-danger">Profil introuvable.</p>;
  }
  const supabase = await createSupabaseServer();
  const prefsQuery = (cols: string) => supabase.from("profiles").select(cols).eq("id", user.id).maybeSingle();
  const [{ count }, full] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", user.id),
    prefsQuery("email_notifications, department, city, price_alerts"),
  ]);
  // Base pas encore migrée (sections 17 et 18 du schéma) : seulement la préférence d'emails.
  const migrated = !full.error;
  const raw = (migrated ? full.data : (await prefsQuery("email_notifications")).data) as Partial<ProfilePrefs> | null;
  const prefs: ProfilePrefs = {
    email_notifications: raw?.email_notifications ?? true,
    department: raw?.department ?? null,
    city: raw?.city ?? null,
    price_alerts: raw?.price_alerts ?? true,
  };
  return (
    <>
      <ProfileForm profile={profile} email={user.email} prefs={prefs} locationReady={migrated} />
      <DeleteAccount listingCount={count ?? 0} />
    </>
  );
}
