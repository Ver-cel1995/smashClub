import {ReactNode} from "react";

interface EmptyStateProps {
    icon?: string
    title: string
    description?: string
    action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center space-y-3">
            {icon && <div className="text-4xl">{icon}</div>}
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {description && (
                <p className="text-sm text-neutral-400 max-w-xs mx-auto">{description}</p>
            )}
            {action && <div className="pt-2">{action}</div>}
        </div>
    )
}