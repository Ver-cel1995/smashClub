'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { toggleReaction } from '@/app/(main)/feed/actions'
import { cn } from '@/shared/lib/utils'
import type { ReactionGroup } from '@/app/(main)/feed/queries'
import { useDebouncedToggle } from '@/shared/hooks/use-debounced-toggle'
import { LottieEmoji } from '@/components/shared/lottie-emoji'
import { AVAILABLE_EMOJI_IDS } from '@/shared/emojis/registry'

interface PostReactionsProps {
    postId: string
    reactions: ReactionGroup[]
}

export function PostReactions({ postId, reactions }: PostReactionsProps) {
    // Начальное состояние: какие эмодзи мы уже поставили
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
                toast.error(result.error || 'Не удалось поставить реакцию')
                throw new Error(result.error || 'toggle failed')
            }
        },
        delay: 500,
    })

    // Отображаемые реакции с учётом optimistic-состояния
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

    // ID эмодзи, которых ещё нет в реакциях — показываются в picker
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
                        toggle(r.id)
                    }}
                    className={cn(
                        'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-all active:scale-95',
                        r.reacted
                            ? 'border-lime-400/40 bg-lime-400/10 text-lime-300'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                    )}
                >
                    <LottieEmoji emojiId={r.id} size={20} loop />
                    <span className="font-medium">{r.count}</span>
                </button>
            ))}

            {unusedEmojiIds.length > 0 && (
                <EmojiPicker
                    emojiIds={unusedEmojiIds}
                    onSelect={(id) => toggle(id)}
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
                className="flex items-center gap-1 rounded-full border border-dashed border-neutral-700 px-2.5 py-1 text-xs text-neutral-400 transition-colors hover:border-neutral-600 hover:text-neutral-300"
            >
                <span className="text-sm">+</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute bottom-full left-0 z-50 mb-2 flex gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-2 shadow-xl">
                        {emojiIds.map((id) => (
                            <button
                                key={id}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onSelect(id)
                                    setIsOpen(false)
                                }}
                                className="rounded-lg p-1.5 transition-colors hover:bg-neutral-800 active:scale-90"
                            >
                                <LottieEmoji emojiId={id} size={28} playOnHover />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}