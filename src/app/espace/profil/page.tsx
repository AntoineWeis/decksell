import type { Metadata } from "next";
import { Suspense } from "react";
import { getProfile, requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";
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
  const { count } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", user.id);
  return (
    <>
      <ProfileForm profile={profile} email={user.email} />
      <DeleteAccount listingCount={count ?? 0} />
    </>
  );
}
