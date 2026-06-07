"use client"

import { useState } from "react"
import type { InputHTMLAttributes } from "react"
import { FiEye, FiEyeOff } from "react-icons/fi"

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export default function FormInput({
  label,
  error,
  id,
  className = "",
  type,
  ...props
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  const inputId = id ?? props.name
  const isPassword = type === "password"
  const inputType = isPassword && showPassword ? "text" : type

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-bold text-[var(--text-main)]"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          className={[
            "w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)]",
            "transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30",
            isPassword ? "pr-12" : "",
            error ? "border-[var(--danger)]" : "",
            className,
          ].join(" ")}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md text-[var(--text-soft)] transition hover:text-[var(--accent-soft)]"
            aria-label={showPassword ? "Nascondi password" : "Mostra password"}
          >
            {showPassword ? (
              <FiEyeOff aria-hidden="true" />
            ) : (
              <FiEye aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  )
}
