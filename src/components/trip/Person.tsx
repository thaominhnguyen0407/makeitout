import { cn } from '../../lib/utils'

const TONES = [
  'bg-[#f2c94c] text-[#3a2c00]',
  'bg-[#7fc8a9] text-[#0f3324]',
  'bg-[#8fb4ff] text-[#0d2357]',
  'bg-[#f59c82] text-[#4a1505]',
  'bg-[#c9a7f5] text-[#2c0f52]',
  'bg-[#f7b7d2] text-[#4f0d2b]',
  'bg-[#b8d86b] text-[#253300]',
]

function toneFor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return TONES[Math.abs(h) % TONES.length]
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

/** A small round initials badge, colour-stable per traveler id. */
export function PersonDot({
  id,
  name,
  size = 'md',
  className,
}: {
  id: string
  name: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      title={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-card',
        size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs',
        toneFor(id),
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
