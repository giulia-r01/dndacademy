import type { ButtonHTMLAttributes, ReactNode } from "react"

type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger"

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: AppButtonVariant
  fullWidth?: boolean
}

const variantClasses: Record<AppButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-[var(--shadow-glow)] hover:brightness-110",
  secondary:
    "border border-[var(--border-teal-soft)] bg-[var(--surface)] text-[var(--text-main)] hover:bg-[var(--surface-soft)]",
  ghost:
    "bg-transparent text-[var(--text-soft)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-main)]",
  danger: "bg-[var(--danger)] text-white hover:brightness-110",
}

export default function AppButton({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  )
}
