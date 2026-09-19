'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Home, Newspaper, Trophy, User } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const navItems = [
    { href: '/home', label: 'Дом', icon: Home },
    { href: '/feed', label: 'Лента', icon: Newspaper },
    { href: '/tournaments', label: 'Турниры', icon: Trophy },
    { href: '/schedule', label: 'Расписание', icon: Calendar },
    { href: '/profile', label: 'Профиль', icon: User },
]

function isItemActive(pathname: string, href: string) {
    return href === '/home' ? pathname === '/home' : pathname.startsWith(href)
}

export function BottomNav() {
    const pathname = usePathname()

    return (
        <nav
            data-tour="bottom-nav"
            className={cn(
                'fixed bottom-0 left-0 right-0 z-40',
                'border-t border-subtle bg-neutral-950/98',
                'pb-[env(safe-area-inset-bottom)]'
            )}
        >
            <div className="mx-auto flex max-w-md items-center justify-around">
                {navItems.map((item) => {
                    const active = isItemActive(pathname, item.href)
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch
                            aria-current={active ? 'page' : undefined}
                            aria-label={item.label}
                            className={cn(
                                'flex flex-1 flex-col items-center gap-1 px-2 py-3',
                                'transition-colors duration-150',
                                active
                                    ? 'text-[var(--accent-color,#a3e635)]'
                                    : 'text-neutral-500 hover:text-neutral-300'
                            )}
                        >
                            <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                            <span className={cn('text-[10px] font-medium', active && 'font-semibold')}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}