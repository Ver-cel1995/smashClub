// src/components/ui/button.tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export type ButtonVariant =
    | 'primary'      // тёмная (dark neutral)
    | 'secondary'    // акцентная лаймовая
    | 'ghost'        // прозрачная
    | 'outline'      // с бордером
    | 'danger'       // красная (для деструктивных)

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
    secondary:
        'bg-lime-400 hover:bg-lime-500 text-neutral-950 shadow-[0_8px_20px_-6px_rgba(163,230,53,0.6)]',
    primary: 'bg-neutral-800 hover:bg-neutral-700 text-white',
    ghost: 'bg-transparent hover:bg-neutral-800/60 text-neutral-300',
    outline:
        'bg-transparent border border-neutral-700 hover:bg-neutral-800/60 text-neutral-200',
    danger: 'bg-rose-500/90 hover:bg-rose-500 text-white',
}

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 text-xs rounded-xl',
    md: 'px-4 py-3.5 text-sm rounded-2xl',
    lg: 'px-6 py-4 text-base rounded-2xl',
    icon: 'p-2 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            fullWidth = false,
            type = 'button',
            ...props
        },
        ref
    ) => {
        return (
            <button
                ref={ref}
                type={type}
                className={cn(
                    'inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-150',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950',
                    'active:scale-[0.98]',
                    fullWidth && 'w-full',
                    sizeClasses[size],
                    variantClasses[variant],
                    className
                )}
                {...props}
            />
        )
    }
)

Button.displayName = 'Button'