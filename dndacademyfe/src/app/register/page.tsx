import AuthLayout from "@/components/auth/AuthLayout"
import RegisterForm from "@/components/auth/RegisterForm"

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Crea account"
      subtitle="Inizia il tuo percorso da avventuriero con D&D Academy."
    >
      <RegisterForm />
    </AuthLayout>
  )
}
