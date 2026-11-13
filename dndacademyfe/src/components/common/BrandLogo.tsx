import Image from "next/image"

type BrandLogoProps = {
  size?: number
  className?: string
}

export default function BrandLogo({ size = 64, className = "" }: BrandLogoProps) {
  return (
    <Image
      src="/brand/dnd-academy.png"
      alt="Logo D&D Academy: dado a venti facce e libro aperto"
      width={size}
      height={size}
      sizes={`${size}px`}
      className={`shrink-0 object-contain ${className}`}
    />
  )
}
