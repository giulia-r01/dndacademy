import Link from "next/link"
import { FiChevronRight } from "react-icons/fi"
import type { Breadcrumb } from "@/lib/navigation"

export default function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  return <nav aria-label="Percorso di navigazione" className="mb-5">
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--text-muted)]">
      {items.map((item, index) => <li key={`${item.href}-${index}`} className="inline-flex min-w-0 items-center gap-2">
        {index > 0 && <FiChevronRight aria-hidden="true" className="shrink-0" />}
        {item.href && index < items.length - 1 ? <Link href={item.href} className="break-words hover:text-[var(--accent-soft)] hover:underline">{item.label}</Link> : <span className="break-words text-[var(--text-soft)]" aria-current="page">{item.label}</span>}
      </li>)}
    </ol>
  </nav>
}
