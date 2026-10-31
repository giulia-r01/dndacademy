export const passwordHint = "Almeno 8 caratteri, una maiuscola e un numero o simbolo. Massimo 72 byte (i caratteri accentati possono occupare più byte)."

export function isPasswordValid(password: string) {
  return password.length >= 8 && new TextEncoder().encode(password).length <= 72 &&
    /[A-Z]/.test(password) && /[0-9!@#$%^&*(),.?":{}|<>]/.test(password)
}
