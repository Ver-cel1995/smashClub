'use client'

import { useState } from 'react'
import { cn } from '@/shared/lib/utils'

const CATEGORIES = [
    {
        id: 'smileys',
        label: '😀',
        emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤔', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮', '😯', '😲', '😴', '🤤', '😪', '😵', '🥴', '🤯', '😎', '🥳', '😞', '😔', '😟', '😕', '🙁'],
    },
    {
        id: 'gestures',
        label: '👍',
        emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐', '✋', '🖖', '👏', '🙌', '🤝', '🙏', '💪', '🦾', '🤳', '💅', '🖕'],
    },
    {
        id: 'hearts',
        label: '❤️',
        emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    },
    {
        id: 'symbols',
        label: '🔥',
        emojis: ['🔥', '⭐', '🌟', '✨', '⚡', '💥', '💫', '💦', '💨', '🌈', '☀️', '⛅', '🌧', '⛈', '❄️', '☃️', '💧', '🎉', '🎊', '🎁', '🎈', '🏆', '🥇', '🥈', '🥉', '🏅', '💯', '✅', '❌', '⚠️'],
    },
    {
        id: 'sport',
        label: '🏸',
        emojis: ['🏸', '🎾', '🏓', '⚽', '🏀', '🏈', '⚾', '🥎', '🏐', '🎱', '🥅', '🎯', '🏹', '🎣', '🥊', '🥋', '🎽', '🛹', '🛼', '🎿', '⛷', '🏂', '🏋️', '🤸', '🤾', '🏊', '🚴', '🏃', '🤼'],
    },
    {
        id: 'food',
        label: '🍕',
        emojis: ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥗', '🍜', '🍝', '🍣', '🍱', '🍤', '🍚', '🍙', '🍘', '🍥', '🥟', '🍦', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '☕', '🍵', '🧃', '🥤'],
    },
]

type Props = {
    onSelect: (emoji: string) => void
}

export function EmojiKeyboard({ onSelect }: Props) {
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id)
    const current = CATEGORIES.find((c) => c.id === activeCategory)!

    return (
        <div className="bg-card">
            {/* Сетка эмодзи */}
            <div className="grid max-h-[220px] grid-cols-8 gap-1 overflow-y-auto p-3">
                {current.emojis.map((emoji, i) => (
                    <button
                        key={`${activeCategory}-${i}`}
                        type="button"
                        onClick={() => onSelect(emoji)}
                        className="flex aspect-square items-center justify-center rounded-lg text-2xl transition-transform hover:bg-neutral-800 active:scale-90"
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Категории */}
            <div className="flex items-center gap-1 border-t border px-2 py-2">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg text-xl transition',
                            activeCategory === cat.id
                                ? 'bg-lime-400/15'
                                : 'hover:bg-neutral-800'
                        )}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
    )
}