import type { InputHTMLAttributes } from "react"

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export default function FormInput({
  label,
  error,
  id,
  className = "",
  ...props
}: FormInputProps) {
  const inputId = id ?? props.name
  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-bold text-[var(--text-main)]"
      >
        {label}
      </label>

      <input
        id={inputId}
        className={[
          "w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)]",
          "transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30",
          error ? "border-[var(--danger)]" : "",
          className,
        ].join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />

      {error && (
        <p id={`${inputId}-error`} className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  )
}
