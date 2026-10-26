import Image from "next/image"
import { FiUser } from "react-icons/fi"

type Props = { name: string; imageUrl: string | null; className?: string }

export default function EntityPortrait({ name, imageUrl, className = "h-[380px] w-full sm:h-[420px] md:w-[270px] lg:h-[380px] lg:w-[248px] lg:shrink-0" }: Props) {
  return <div className={`relative overflow-hidden rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] ${className}`}>
    {imageUrl ? <Image unoptimized src={imageUrl} alt={`Ritratto di ${name}`} fill className="object-cover object-top" sizes="(max-width: 767px) 100vw, 248px" />
      : <div className="flex h-full items-center justify-center text-[var(--accent)]"><FiUser size={42} aria-label={`Ritratto non disponibile per ${name}`} /></div>}
  </div>
}
