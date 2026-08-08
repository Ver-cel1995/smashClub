'use client'

import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { shouldTruncate } from '@/shared/lib/format'

interface PostContentProps {
    /** Заголовок поста */
    title?: string | null
    /** Текст поста */
    content: string
    /** true = детальная страница (без обрезки), false = превью (с обрезкой) */
    full?: boolean
}

export function PostContent({ title, content, full = false }: PostContentProps) {
    const needsTruncate = !full && shouldTruncate(content)
    const [expanded, setExpanded] = useState(false)

    const isTruncated = needsTruncate && !expanded

    return (
        <div className="space-y-2">
            {title && (
                <h3 className={cn(
                    'font-bold text-white',
                    full ? 'text-lg leading-snug' : 'text-base leading-snug'
                )}>
                    {title}
                </h3>
            )}

            <div
                className={cn(
                    'text-sm text-neutral-200 whitespace-pre-wrap break-words leading-relaxed',
                    isTruncated && 'line-clamp-4'
                )}
            >
                {content}
            </div>

            {needsTruncate && !expanded && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setExpanded(true)
                    }}
                    className="text-sm font-medium text-lime-400 hover:text-lime-300 transition-colors"
                >
                    Показать полностью
                </button>
            )}
        </div>
    )
}