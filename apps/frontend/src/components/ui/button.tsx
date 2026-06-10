import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type ButtonVariant = 'primary' | 'secondary'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-indigo-400/40 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25 disabled:hover:bg-indigo-500/15',
  secondary:
    'border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 disabled:hover:bg-zinc-900',
}

export function Button({
  className,
  variant = 'secondary',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
