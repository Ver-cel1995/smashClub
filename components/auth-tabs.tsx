'use client'

import Link from 'next/link'
import { cn } from "@/shared/lib/utils";

export type AuthTab = 'login' | 'register'

const TABS: { key: AuthTab; label: string; href: string }[] = [
    { key: 'login', label: 'Войти', href: '/login' },
    { key: 'register', label: 'Регистрация', href: '/register' },
]

export function AuthTabs({ active }: { active: AuthTab }) {
    return (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-neutral-900 p-1">
            {TABS.map((tab) => (
                <Link
                    key={tab.key}
                    href={tab.href}
                    className={cn(
                        'rounded-xl py-2.5 text-center text-sm font-semibold transition-colors duration-150',
                        active === tab.key
                            ? 'bg-accent'
                            : 'text-neutral-400 hover:text-neutral-200'
                    )}
                >
                    {tab.label}
                </Link>
            ))}
        </div>
    )
}
