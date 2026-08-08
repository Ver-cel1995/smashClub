'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Newspaper, Trophy, Calendar, User } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const navItems = [
    { href: '/home', label: 'Дом', icon: Home },
    { href: '/feed', label: 'Лента', icon: Newspaper },
    { href: '/tournaments', label: 'Турниры', icon: Trophy },
    { href: '/schedule', label: 'Расписание', icon: Calendar },
    { href: '/profile', label: 'Профиль', icon: User },
]

export function BottomNav() {
    const pathname = usePathname()

    return (
        <nav
            className={cn(
                'fixed bottom-0 left-0 right-0 z-40',
                'border-t border-neutral-800 bg-neutral-950/95 backdrop-blur',
                'pb-[env(safe-area-inset-bottom)]' // safe area для iPhone
            )}
        >
            <div className="mx-auto flex max-w-md items-center justify-around">
                {navItems.map((item) => {
                    // Активный если pathname начинается с href (для вложенных страниц)
                    const isActive =
                        item.href === '/home'
                            ? pathname === '/home'
                            : pathname.startsWith(item.href)

                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-1 flex-col items-center gap-1 px-2 py-3',
                                'transition-colors duration-150',
                                isActive
                                    ? 'text-lime-400'
                                    : 'text-neutral-500 hover:text-neutral-300'
                            )}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                            <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                {item.label}
              </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}