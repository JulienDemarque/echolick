import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type CardProps = HTMLAttributes<HTMLElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <section
      className={cn('rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-sm', className)}
      {...props}
    />
  )
}

type CardTitleProps = {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
  return <h2 className={cn('text-base font-semibold text-zinc-100', className)}>{children}</h2>
}
