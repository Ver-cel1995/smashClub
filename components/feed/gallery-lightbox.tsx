'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { formatDayMonth } from '@/shared/lib/format'

type LightboxItem = {
    url: string
    postId: string
    postTitle: string | null
    createdAt: string
}

type Props = {
    items: LightboxItem[]
    startIndex: number
    onClose: () => void
}

export function GalleryLightbox({ items, startIndex, onClose }: Props) {
    const [idx, setIdx] = useState(startIndex)
    const item = items[idx]

    const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), [])
    const next = useCallback(
        () => setIdx((i) => Math.min(items.length - 1, i + 1)),
        [items.length]
    )

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowLeft') prev()
            if (e.key === 'ArrowRight') next()
        }
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', onKey)
        }
    }, [onClose, prev, next])

    if (!item) return null

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                        {item.postTitle ?? 'Без заголовка'}
                    </p>
                    <p className="text-xs text-white/50">{formatDayMonth(item.createdAt)}</p>
                </div>
                <Link
                    href={`/feed/${item.postId}`}
                    className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary transition hover:bg-white/10"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Пост
                </Link>
                <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-white transition hover:bg-white/10"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Image */}
            <div className="relative flex-1">
                <Image
                    src={item.url}
                    alt={item.postTitle ?? ''}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority
                />

                {idx > 0 && (
                    <button
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur transition hover:bg-black/60"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                )}
                {idx < items.length - 1 && (
                    <button
                        onClick={next}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur transition hover:bg-black/60"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                )}
            </div>

            {/* Counter */}
            <div className="py-3 text-center text-xs text-white/40">
                {idx + 1} / {items.length}
            </div>
        </div>
    )
}