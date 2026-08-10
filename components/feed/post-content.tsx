'use client'

import {useState} from 'react'
import {cn} from '@/shared/lib/utils'
import {useProgressRouter} from "@/shared/hooks/use-progress-router";

/** Сколько строк показывать в свёрнутом виде */
const COLLAPSED_LINES = 4
/** Сколько строк показывать в "показать частично" */
const EXPANDED_LINES = 8
/** Сколько символов для определения "длинный пост" */
const LONG_POST_CHARS = 400

type State = 'collapsed' | 'partial' | 'full'

type PostContentProps = {
    title?: string | null
    content: string
    /** ID поста для перехода на полную страницу */
    postId?: string
    /** true = детальная страница (без обрезки) */
    full?: boolean
}

export function PostContent({ title, content, postId, full = false }: PostContentProps) {
    const router = useProgressRouter()
    const [state, setState] = useState<State>('collapsed')

    // На полной странице — показываем всё
    if (full) {
        return (
            <div className="space-y-2">
                {title && (
                    <h3 className="text-lg font-bold text-white leading-snug">{title}</h3>
                )}
                <div className="text-sm text-neutral-200 whitespace-pre-wrap break-words leading-relaxed">
                    {content}
                </div>
            </div>
        )
    }

    const lines = content.split('\n').length
    const isLong = content.length > LONG_POST_CHARS || lines > EXPANDED_LINES

    // Нужна ли обрезка вообще?
    const needsCollapse = content.length > 280 || lines > COLLAPSED_LINES

    if (!needsCollapse) {
        return (
            <div className="space-y-2">
                {title && (
                    <h3 className="text-base font-bold text-white leading-snug">{title}</h3>
                )}
                <div className="text-sm text-neutral-200 whitespace-pre-wrap break-words leading-relaxed">
                    {content}
                </div>
            </div>
        )
    }

    const lineClamp =
        state === 'collapsed'
            ? `line-clamp-${COLLAPSED_LINES}`
            : state === 'partial'
                ? `line-clamp-[12]`
                : ''

    return (
        <div className="space-y-2">
            {title && (
                <h3 className="text-base font-bold text-white leading-snug">{title}</h3>
            )}

            <div
                className={cn(
                    'text-sm text-neutral-200 whitespace-pre-wrap break-words leading-relaxed',
                    state === 'collapsed' && 'line-clamp-4',
                    state === 'partial' && 'line-clamp-[12]'
                )}
            >
                {content}
            </div>

            {state === 'collapsed' && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setState(isLong ? 'partial' : 'full')
                    }}
                    className="text-sm font-medium text-lime-400 hover:text-lime-300 transition-colors"
                >
                    Показать полностью
                </button>
            )}

            {state === 'partial' && isLong && postId && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        router.push(`/feed/${postId}`)
                    }}
                    className="text-sm font-medium text-lime-400 hover:text-lime-300 transition-colors"
                >
                    Читать далее →
                </button>
            )}
        </div>
    )
}