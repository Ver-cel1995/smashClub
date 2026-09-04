'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { toggleReaction } from '@/app/(main)/feed/actions'
import { cn } from '@/shared/lib/utils'
import type { ReactionGroup } from '@/app/(main)/feed/queries'
import { useDebouncedToggle } from '@/shared/hooks/use-debounced-toggle'
import { LottieEmoji } from '@/components/shared/lottie-emoji'
import { AVAILABLE_EMOJI_IDS } from '@/shared/emojis/registry'

type PostReactionsProps = {
    postId: string
    reactions: ReactionGroup[]
}

export function PostReactions({ postId, reactions }: PostReactionsProps) {
    const initial = useMemo(() => {
        const map: Record<string, boolean> = {}
        for (const id of AVAILABLE_EMOJI_IDS) {
            map[id] = reactions.find((r) => r.emoji === id)?.reacted ?? false
        }
        return map
    }, [reactions])

    const { state, toggle } = useDebouncedToggle({
        initial,
        commit: async (emojiId) => {
            const result = await toggleReaction(postId, emojiId)
            if (!result.success) {
                toast.error(result.error || 'Не удалось обновить реакцию')
                throw new Error(result.error || 'toggle failed')
            }
        },
        delay: 400,
    })

    // Считаем, сколько реакций у текущего пользователя прямо сейчас включено
    const myActiveCount = useMemo(() => {
        return Object.values(state).filter(Boolean).length
    }, [state])

    const handleToggle = (emojiId: string) => {
        const isCurrentlyActive = Boolean(state[emojiId])

        // Если пытаемся поставить новую реакцию (не снять имеющуюся) и их УЖЕ 2
        if (!isCurrentlyActive && myActiveCount >= 2) {
            toast.warning('Можно выбрать не более 2 реакций')
            return
        }

        toggle(emojiId)
    }

    const displayReactions = useMemo(() => {
        return AVAILABLE_EMOJI_IDS.map((id) => {
            const server = reactions.find((r) => r.emoji === id)
            const serverCount = server?.count ?? 0
            const serverReacted = server?.reacted ?? false
            const currentReacted = state[id]

            let count = serverCount
            if (currentReacted && !serverReacted) count += 1
            if (!currentReacted && serverReacted) count -= 1

            return {
                id,
                count,
                reacted: currentReacted,
            }
        }).filter((r) => r.count > 0 || r.reacted)
    }, [reactions, state])

    const unusedEmojiIds = useMemo(
        () =>
            AVAILABLE_EMOJI_IDS.filter(
                (id) => !displayReactions.some((r) => r.id === id)
            ),
        [displayReactions]
    )

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {displayReactions.map((r) => (
                <button
                    key={r.id}
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleToggle(r.id)
                    }}
                    className={cn(
                        'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all active:scale-95 shadow-sm',
                        r.reacted
                            ? 'border-accent bg-accent-muted text-accent font-semibold'
                            : 'border-card bg-card text-muted hover:bg-hover hover:text-strong'
                    )}
                >
                    <LottieEmoji emojiId={r.id} size={20} loop />
                    <span className="font-medium">{r.count}</span>
                </button>
            ))}

            {/* Показываем выбор нового эмодзи, только если не исчерпан лимит в 2 реакции */}
            {unusedEmojiIds.length > 0 && myActiveCount < 2 && (
                <EmojiPicker
                    emojiIds={unusedEmojiIds}
                    onSelect={(id) => handleToggle(id)}
                />
            )}
        </div>
    )
}

function EmojiPicker({
                         emojiIds,
                         onSelect,
                     }: {
    emojiIds: string[]
    onSelect: (id: string) => void
}) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                }}
                className="flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-strong bg-subtle text-muted transition-colors hover:border-accent hover:text-accent active:scale-95"
                aria-label="Добавить реакцию"
            >
                <span className="text-sm leading-none">+</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute bottom-full left-0 z-50 mb-2 flex gap-1 rounded-2xl border border-card bg-elevated p-1.5 shadow-elevated animate-in fade-in zoom-in-95 duration-150">
                        {emojiIds.map((id) => (
                            <button
                                key={id}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onSelect(id)
                                    setIsOpen(false)
                                }}
                                className="rounded-xl p-1.5 transition-colors hover:bg-hover active:scale-90"
                            >
                                <LottieEmoji emojiId={id} size={26} playOnHover />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}