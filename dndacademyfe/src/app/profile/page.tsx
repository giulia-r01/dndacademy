"use client"

import AppShell from "@/components/layout/AppShell"
import ProfileForms from "@/components/profile/ProfileForms"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export default function ProfilePage() {
  const { user } = useCurrentUser()
  return <AppShell><section className="space-y-6">
    <div><h2 className="text-3xl font-black">Il tuo profilo</h2><p className="mt-2 text-[var(--text-soft)]">Gestisci il tuo account, l’immagine profilo e la sicurezza.</p></div>
    {user && <ProfileForms key={user.id} user={user} />}
  </section></AppShell>
}
