import { cn } from "@/lib/utils"

interface ShimmerEffectProps {
  className?: string
}

export function ShimmerEffect({ className }: ShimmerEffectProps) {
  return (
    <div 
      className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        "bg-gradient-to-r from-transparent via-white/20 to-transparent",
        "animate-shimmer",
        className
      )}
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        animation: 'shimmer 2s infinite'
      }}
    />
  )
}