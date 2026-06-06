import type { HTMLAttributes, ReactNode } from "react"

type AppCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export default function AppCard({
  children,
  className = "",
  ...props
}: AppCardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface)] p-6 shadow-sm",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  )
}
