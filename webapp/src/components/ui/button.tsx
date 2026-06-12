import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'

type Variant = 'lime' | 'ghost' | 'ink' | 'cream'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  lime: 'bg-lime text-ink hover:bg-lime-deep shadow-[0_6px_24px_-8px_rgba(200,255,90,0.6)] hover:-translate-y-px',
  ghost: 'text-cream border border-[var(--line-dark)] hover:border-lime hover:text-lime',
  ink: 'bg-ink text-cream hover:bg-forest-deep',
  cream: 'bg-cream text-ink hover:bg-white',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-[11px] text-[14.5px]',
  lg: 'px-7 py-4 text-base',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function Button({ variant = 'lime', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-all duration-150',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </button>
  )
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function LinkButton({ variant = 'lime', size = 'md', className, children, ...props }: LinkButtonProps) {
  return (
    <a
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </a>
  )
}
