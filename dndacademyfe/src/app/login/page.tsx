import AuthLayout from "@/components/auth/AuthLayout"
import LoginForm from "@/components/auth/LoginForm"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ passwordChanged?: string }> }) {
  const { passwordChanged } = await searchParams
  return (
    <AuthLayout
      title="Accedi"
      subtitle="Inserisci le tue credenziali per continuare il tuo percorso."
    >
      {passwordChanged === "1" && <p role="status" className="mb-5 text-sm text-[var(--primary)]">Password aggiornata. Accedi con la nuova password.</p>}
      <LoginForm />
    </AuthLayout>
  )
}
