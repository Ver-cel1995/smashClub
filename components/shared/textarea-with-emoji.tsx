'use client'

import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react'
import { Smile } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { EmojiKeyboard } from '@/components/feed/emoji-keyboard'

export interface TextareaWithEmojiHandle {
    focus: () => void
    blur: () => void
    getValue: () => string
    setValue: (value: string) => void
}

interface Props {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    rows?: number
    minHeight?: number
    maxHeight?: number
    className?: string
    /** Показывать ли счётчик символов */
    maxLength?: number
    /** Название поля (для form) */
    name?: string
    /** id для label */
    id?: string
}

export const TextareaWithEmoji = forwardRef<TextareaWithEmojiHandle, Props>(
    function TextareaWithEmoji(
        {
            value,
            onChange,
            placeholder,
            disabled,
            rows = 3,
            minHeight = 80,
            maxHeight = 300,
            className,
            maxLength,
            name,
            id,
        },
        ref
    ) {
        const [emojiOpen, setEmojiOpen] = useState(false)
        const textareaRef = useRef<HTMLTextAreaElement>(null)

        useImperativeHandle(ref, () => ({
            focus: () => textareaRef.current?.focus(),
            blur: () => textareaRef.current?.blur(),
            getValue: () => value,
            setValue: (v: string) => onChange(v),
        }))

        // Автовысота
        useEffect(() => {
            const el = textareaRef.current
            if (!el) return
            el.style.height = 'auto'
            el.style.height = `${Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)}px`
        }, [value, minHeight, maxHeight])

        const toggleEmoji = () => {
            if (emojiOpen) {
                setEmojiOpen(false)
                requestAnimationFrame(() => textareaRef.current?.focus())
            } else {
                textareaRef.current?.blur()
                setEmojiOpen(true)
            }
        }

        const insertEmoji = (emoji: string) => {
            const el = textareaRef.current
            if (!el) {
                onChange(value + emoji)
                return
            }
            const start = el.selectionStart ?? value.length
            const end = el.selectionEnd ?? value.length
            const newValue = value.slice(0, start) + emoji + value.slice(end)
            onChange(newValue)

            requestAnimationFrame(() => {
                const pos = start + emoji.length
                el.setSelectionRange(pos, pos)
            })
        }

        const handleFocus = () => setEmojiOpen(false)

        return (
            <div
                className={cn(
                    'overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 transition-colors focus-within:border-accent',
                    disabled && 'opacity-60',
                    className
                )}
            >
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        id={id}
                        name={name}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onFocus={handleFocus}
                        disabled={disabled}
                        placeholder={placeholder}
                        rows={rows}
                        maxLength={maxLength}
                        style={{ minHeight, maxHeight }}
                        className="w-full resize-none bg-transparent px-4 py-3 pr-12 text-sm text-white placeholder-neutral-500 focus:outline-none"
                    />

                    <button
                        type="button"
                        onClick={toggleEmoji}
                        disabled={disabled}
                        className={cn(
                            'absolute right-2 top-2 rounded-lg p-1.5 transition-colors',
                            emojiOpen
                                ? 'text-accent'
                                : 'text-neutral-500 hover:text-neutral-300'
                        )}
                        aria-label="Эмодзи"
                    >
                        <Smile className="h-5 w-5" />
                    </button>
                </div>

                {maxLength && (
                    <div className="flex justify-end px-3 pb-1 text-[10px] text-neutral-500">
                        {value.length} / {maxLength}
                    </div>
                )}

                {emojiOpen && (
                    <div className="border-t border-neutral-800">
                        <EmojiKeyboard onSelect={insertEmoji} />
                    </div>
                )}
            </div>
        )
    }
)