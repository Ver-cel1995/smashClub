'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
    Home,
    Newspaper,
    Trophy,
    Calendar,
    User,
    Loader2,
} from 'lucide-react'
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
    const router = useRouter()
    const [pendingHref, setPendingHref] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const navLocked = isPending || pendingHref !== null

    useEffect(() => {
        setPendingHref(null)
    }, [pathname])

    // Safety unlock, если вдруг навигация подвисла/упала
    useEffect(() => {
        if (!pendingHref) return

        const id = window.setTimeout(() => {
            setPendingHref(null)
        }, 15000)

        return () => window.clearTimeout(id)
    }, [pendingHref])

    const handleNavigate = (href: string, active: boolean) => {
        if (active || navLocked) return

        setPendingHref(href)

        startTransition(() => {
            router.push(href)
        })
    }

    return (
        <nav
            className={cn(
                'fixed bottom-0 left-0 right-0 z-40',
                'border-t border-neutral-800 bg-neutral-950/95 backdrop-blur',
                'pb-[env(safe-area-inset-bottom)]'
            )}
            aria-busy={navLocked}
        >
            <div className="mx-auto flex max-w-md items-center justify-around">
                {navItems.map((item) => {
                    const active = isItemActive(pathname, item.href)
                    const pending = pendingHref === item.href
                    const Icon = item.icon

                    return (
                        <button
                            key={item.href}
                            type="button"
                            onClick={() => handleNavigate(item.href, active)}
                            disabled={navLocked || active}
                            aria-current={active ? 'page' : undefined}
                            aria-label={item.label}
                            className={cn(
                                'flex flex-1 flex-col items-center gap-1 px-2 py-3',
                                'transition-colors duration-150',
                                active
                                    ? 'text-lime-400'
                                    : 'text-neutral-500 hover:text-neutral-300',
                                (navLocked || active) && 'disabled:cursor-default',
                                pending && 'opacity-90'
                            )}
                        >
                            {pending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                            )}

                            <span
                                className={cn(
                                    'text-[10px] font-medium',
                                    active && 'font-semibold'
                                )}
                            >
                {item.label}
              </span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}