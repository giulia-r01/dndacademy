import AuthLayout from "@/components/auth/AuthLayout"
import LoginForm from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <AuthLayout
      title="Accedi"
      subtitle="Inserisci le tue credenziali per continuare il tuo percorso."
    >
      <LoginForm />
    </AuthLayout>
  )
}
