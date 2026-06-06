import AuthLayout from "@/components/auth/AuthLayout"
import AppButton from "@/components/common/AppButton"
import FormInput from "@/components/common/FormInput"

export default function LoginPage() {
  return (
    <AuthLayout
      title="Accedi"
      subtitle="Inserisci le tue credenziali per continuare il tuo percorso."
    >
      <form className="space-y-5">
        <FormInput
          label="Username"
          name="username"
          type="text"
          placeholder="Il tuo username"
          autoComplete="username"
        />

        <FormInput
          label="Password"
          name="password"
          type="password"
          placeholder="La tua password"
          autoComplete="current-password"
        />

        <AppButton type="submit" fullWidth>
          Accedi
        </AppButton>
      </form>
    </AuthLayout>
  )
}
