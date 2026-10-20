import type { Metadata } from "next";
import { Suspense } from "react";
import { getProfile, requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";

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
  return <ProfileForm profile={profile} email={user.email} />;
}
