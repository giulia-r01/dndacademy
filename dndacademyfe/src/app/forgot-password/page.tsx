import AuthLayout from "@/components/auth/AuthLayout"
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm"

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Recupera password"
      subtitle="Inserisci la tua email e ti invieremo un link per scegliere una nuova password."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
