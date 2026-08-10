import { cn } from '@/shared/lib/utils'
import type { ReactNode } from 'react'

type Props = {
    icon?: string | ReactNode
    title: string
    description?: string
    action?: ReactNode
    className?: string
    compact?: boolean
}

export function EmptyState({
                               icon,
                               title,
                               description,
                               action,
                               className,
                               compact,
                           }: Props) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-3 text-center',
                compact ? 'py-8' : 'py-16',
                className
            )}
        >
            {icon && (
                <div
                    className={cn(
                        'flex items-center justify-center rounded-full bg-neutral-900',
                        compact ? 'h-12 w-12 text-2xl' : 'h-16 w-16 text-3xl'
                    )}
                >
                    {icon}
                </div>
            )}
            <div className="space-y-1">
                <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
                {description && (
                    <p className="max-w-xs text-xs leading-relaxed text-neutral-500">
                        {description}
                    </p>
                )}
            </div>
            {action && <div className="mt-2">{action}</div>}
        </div>
    )
}