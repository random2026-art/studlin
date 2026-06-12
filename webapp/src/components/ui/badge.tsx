import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type Color = 'lime' | 'ink' | 'cream' | 'forest' | 'butter' | 'mint' | 'rose'

const colorClasses: Record<Color, string> = {
  lime: 'bg-lime text-ink',
  ink: 'bg-ink text-cream',
  cream: 'bg-cream text-ink',
  forest: 'bg-forest text-cream',
  butter: 'bg-butter text-ink',
  mint: 'bg-mint text-ink',
  rose: 'bg-rose text-ink',
}

interface BadgeProps {
  color?: Color
  className?: string
  children: ReactNode
}

export function Badge({ color = 'lime', className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold tracking-wide',
        colorClasses[color],
        className,
      )}
    >
      {children}
    </span>
  )
}
