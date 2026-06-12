import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type Variant = 'white' | 'cream' | 'forest' | 'paper'

const variantClasses: Record<Variant, string> = {
  white: 'bg-white border border-[var(--line)]',
  cream: 'bg-cream border border-[var(--line)]',
  forest: 'bg-forest border border-[var(--line-dark)]',
  paper: 'bg-paper border border-[var(--line)]',
}

interface CardProps {
  variant?: Variant
  shadow?: boolean
  className?: string
  children: ReactNode
}

export function Card({ variant = 'white', shadow = false, className, children }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-[18px]',
        variantClasses[variant],
        shadow && 'shadow-[var(--shadow-card)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
