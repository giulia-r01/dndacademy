import AuthLayout from "@/components/auth/AuthLayout"
import ResetPasswordForm from "@/components/auth/ResetPasswordForm"

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string
  }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams
  const token = params.token ?? ""

  return (
    <AuthLayout
      title="Reimposta password"
      subtitle="Scegli una nuova password sicura per il tuo account."
    >
      <ResetPasswordForm initialToken={token} />
    </AuthLayout>
  )
}
