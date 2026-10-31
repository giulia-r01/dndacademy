import Image from "next/image"

export default function UserAvatar({ username, avatarUrl, large = false }: { username: string; avatarUrl?: string | null; large?: boolean }) {
  return <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] font-black text-white ${large ? "h-28 w-28 text-4xl" : "h-9 w-9 text-sm"}`}>
    {avatarUrl ? <Image src={avatarUrl} alt={`Immagine profilo di ${username}`} fill unoptimized sizes={large ? "112px" : "36px"} className="object-cover" /> : <span aria-label={`Profilo di ${username}`}>{username.charAt(0).toUpperCase()}</span>}
  </span>
}
