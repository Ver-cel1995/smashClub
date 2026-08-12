'use client'

import Link from 'next/link'
import { Plus, X, FileText, BarChart3 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useUIStore } from '@/store/ui-store'
import {ReactNode} from "react";

export function CreatePostFab() {
    const { fabOpen, setFabOpen, toggleFab } = useUIStore()

    return (
        <>
            {fabOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setFabOpen(false)}
                />
            )}

            <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3">
                {fabOpen && (
                    <>
                        <FabOption
                            href="/feed/new?type=poll"
                            icon={<BarChart3 className="h-5 w-5" />}
                            label="Опросник"
                            onClick={() => setFabOpen(false)}
                        />
                        <FabOption
                            href="/feed/new?type=post"
                            icon={<FileText className="h-5 w-5" />}
                            label="Пост"
                            onClick={() => setFabOpen(false)}
                        />
                    </>
                )}

                <button
                    type="button"
                    onClick={toggleFab}
                    className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all active:scale-95',
                        fabOpen
                            ? 'bg-neutral-700 text-white rotate-45'
                            : 'bg-accent shadow-accent'
                    )}
                    aria-label={fabOpen ? 'Закрыть' : 'Создать'}
                >
                    {fabOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6 stroke-[2.5]" />}
                </button>
            </div>
        </>
    )
}

function FabOption({ href,icon,label,onClick }: { // todo
    href: string
    icon: ReactNode
    label: string
    onClick: () => void
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
      <span className="rounded-full bg-card border-card px-3 py-1.5 text-xs font-medium text-white shadow-lg">
        {label}
      </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-accent">
        {icon}
      </span>
        </Link>
    )
}