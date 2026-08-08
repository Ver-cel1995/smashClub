'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, X, FileText, BarChart3 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export function CreatePostFab() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            {/* Затемнение фона когда открыто */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3">
                {/* Опции — появляются при открытии */}
                {isOpen && (
                    <>
                        <FabOption
                            href="/feed/new?type=poll"
                            icon={<BarChart3 className="h-5 w-5" />}
                            label="Опросник"
                            onClick={() => setIsOpen(false)}
                        />
                        <FabOption
                            href="/feed/new?type=post"
                            icon={<FileText className="h-5 w-5" />}
                            label="Пост"
                            onClick={() => setIsOpen(false)}
                        />
                    </>
                )}

                {/* Главная кнопка */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-full text-neutral-950 shadow-lg transition-all active:scale-95',
                        isOpen
                            ? 'bg-neutral-700 text-white rotate-45'
                            : 'bg-lime-400 hover:bg-lime-500 shadow-lime-400/20'
                    )}
                    aria-label={isOpen ? 'Закрыть' : 'Создать'}
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6 stroke-[2.5]" />}
                </button>
            </div>
        </>
    )
}

function FabOption({
                       href,
                       icon,
                       label,
                       onClick,
                   }: {
    href: string
    icon: React.ReactNode
    label: string
    onClick: () => void
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
            {/* Ярлык с названием */}
            <span className="rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
        {label}
      </span>
            {/* Иконка в кружке */}
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-400 text-neutral-950 shadow-lg shadow-lime-400/20">
        {icon}
      </span>
        </Link>
    )
}