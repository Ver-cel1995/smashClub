// src/components/ui/button.tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export type ButtonVariant =
    | 'primary'      // нейтральная (адаптируется под тему)
    | 'secondary'    // акцентная
    | 'ghost'        // прозрачная
    | 'outline'      // с бордером
    | 'danger'       // красная

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
    secondary:
        'bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)] shadow-[0_8px_20px_-6px_var(--accent-glow)]',
    primary:
        'bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-strong)] border border-[var(--border-card)]',
    ghost:
        'bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-main)]',
    outline:
        'bg-transparent border border-[var(--border-strong)] hover:bg-[var(--bg-hover)] text-[var(--text-main)]',
    danger:
        'bg-[var(--danger)] hover:opacity-90 text-white',
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
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]/60',
                    'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)]',
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