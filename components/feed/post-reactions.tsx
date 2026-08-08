'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { toggleReaction } from '@/app/(main)/feed/actions'
import { cn } from '@/shared/lib/utils'
import type { ReactionGroup } from '@/app/(main)/feed/queries'

const AVAILABLE_EMOJIS = ['❤️', '🔥', '👏', '🎉', '💪']

interface PostReactionsProps {
    postId: string
    reactions: ReactionGroup[]
}

export function PostReactions({ postId, reactions }: PostReactionsProps) {
    const [isPending, startTransition] = useTransition()

    const [optimisticReactions, updateOptimistic] = useOptimistic(
        reactions,
        (
            current: ReactionGroup[],
            action: { emoji: string; type: 'add' | 'remove' }
        ) => {
            const exists = current.find((r) => r.emoji === action.emoji)

            if (action.type === 'remove' && exists) {
                if (exists.count <= 1) {
                    return current.filter((r) => r.emoji !== action.emoji)
                }
                return current.map((r) =>
                    r.emoji === action.emoji
                        ? { ...r, count: r.count - 1, reacted: false }
                        : r
                )
            }

            if (action.type === 'add') {
                if (exists) {
                    return current.map((r) =>
                        r.emoji === action.emoji
                            ? { ...r, count: r.count + 1, reacted: true }
                            : r
                    )
                }
                return [...current, { emoji: action.emoji, count: 1, reacted: true }]
            }

            return current
        }
    )

    const handleToggle = (emoji: string) => {
        const existing = optimisticReactions.find((r) => r.emoji === emoji)
        const isRemoving = existing?.reacted

        startTransition(async () => {
            updateOptimistic({
                emoji,
                type: isRemoving ? 'remove' : 'add',
            })

            const result = await toggleReaction(postId, emoji)
            if (!result.success) {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    const unusedEmojis = AVAILABLE_EMOJIS.filter(
        (e) => !optimisticReactions.some((r) => r.emoji === e)
    )

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {optimisticReactions.map((r) => (
                <button
                    key={r.emoji}
                    type="button"
                    disabled={isPending}
                    onClick={(e) => {
                        e.stopPropagation()
                        handleToggle(r.emoji)
                    }}
                    className={cn(
                        'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-all active:scale-95',
                        'disabled:opacity-60',
                        r.reacted
                            ? 'border-lime-400/40 bg-lime-400/10 text-lime-300'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                    )}
                >
                    {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <span>{r.emoji}</span>
                    )}
                    <span className="font-medium">{r.count}</span>
                </button>
            ))}

            {unusedEmojis.length > 0 && (
                <EmojiPicker
                    emojis={unusedEmojis}
                    onSelect={(emoji) => handleToggle(emoji)}
                    disabled={isPending}
                />
            )}
        </div>
    )
}

function EmojiPicker({
                         emojis,
                         onSelect,
                         disabled,
                     }: {
    emojis: string[]
    onSelect: (emoji: string) => void
    disabled: boolean
}) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                }}
                className={cn(
                    'flex items-center gap-1 rounded-full border border-dashed border-neutral-700 px-2.5 py-1 text-xs text-neutral-400 hover:border-neutral-600 hover:text-neutral-300 transition-colors',
                    'disabled:opacity-40 disabled:pointer-events-none'
                )}
            >
                <span className="text-sm">+</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute bottom-full mb-2 left-0 z-50 flex gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-2 shadow-xl">
                        {emojis.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                disabled={disabled}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onSelect(emoji)
                                    setIsOpen(false)
                                }}
                                className="rounded-lg p-1.5 text-lg hover:bg-neutral-800 transition-colors active:scale-90 disabled:opacity-40"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}