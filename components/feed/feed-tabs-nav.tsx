import Link from 'next/link'
import { cn } from '@/shared/lib/utils'

type Props = {
    active: 'feed' | 'gallery'
}

const TABS = [
    { id: 'feed', label: 'Лента', href: '/feed' },
    { id: 'gallery', label: 'Галерея', href: '/feed?tab=gallery' },
] as const

export function FeedTabsNav({ active }: Props) {
    return (
        <div className="flex gap-2 px-4 pt-4">
            {TABS.map((tab) => (
                <Link
                    key={tab.id}
                    href={tab.href}
                    scroll={false}
                    prefetch
                    className={cn(
                        'inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium transition-colors',
                        active === tab.id
                            ? 'bg-subtle text-strong'
                            : 'border border-card text-muted hover:border-strong hover:text-main'
                    )}
                >
                    {tab.label}
                </Link>
            ))}
        </div>
    )
}