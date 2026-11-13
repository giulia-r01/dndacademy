import AuthLayout from "@/components/auth/AuthLayout"
import LoginForm from "@/components/auth/LoginForm"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ passwordChanged?: string; accountDeleted?: string }> }) {
  const { passwordChanged, accountDeleted } = await searchParams
  return (
    <AuthLayout
      title="Accedi"
      subtitle="Inserisci le tue credenziali per continuare il tuo percorso."
    >
      {passwordChanged === "1" && <p role="status" className="mb-5 text-sm text-[var(--primary)]">Password aggiornata. Accedi con la nuova password.</p>}
      <LoginForm />
      {accountDeleted === "1" && <p role="status" className="mt-5 text-sm text-[var(--primary)]">Il tuo account è stato eliminato. La rimozione dell’immagine profilo verrà completata automaticamente.</p>}
    </AuthLayout>
  )
}
