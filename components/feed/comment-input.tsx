'use client'

import { useState, useRef } from 'react'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { addComment } from '@/app/(main)/feed/actions'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import { TextareaWithEmoji, type TextareaWithEmojiHandle } from '@/components/shared/textarea-with-emoji'

type CommentInputProps = {
    postId: string
    parentCommentId?: string
    placeholder?: string
    autoFocus?: boolean
    onSubmitted?: () => void
}

export function CommentInput({
                                 postId,
                                 parentCommentId,
                                 placeholder = 'Написать комментарий...',
                                 autoFocus = false,
                                 onSubmitted,
                             }: CommentInputProps) {
    const [text, setText] = useState('')
    const [runAction, isPending] = useProgressAction()
    const inputRef = useRef<TextareaWithEmojiHandle>(null)

    // Автофокус
    useState(() => {
        if (autoFocus) {
            requestAnimationFrame(() => inputRef.current?.focus())
        }
    })

    const handleSubmit = () => {
        const value = text.trim()
        if (!value) return

        runAction(async () => {
            const result = await addComment(postId, value, parentCommentId)
            if (result.success) {
                setText('')
                onSubmitted?.()
            } else {
                toast.error(result.error || 'Не удалось отправить')
            }
        })
    }

    return (
        <div className="flex items-end gap-2">
            <div className="flex-1">
                <TextareaWithEmoji
                    ref={inputRef}
                    value={text}
                    onChange={setText}
                    placeholder={placeholder}
                    disabled={isPending}
                    minHeight={44}
                    maxHeight={128}
                    rows={1}
                />
            </div>

            <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !text.trim()}
                className="shrink-0 rounded-xl bg-lime-400 p-2.5 text-neutral-950 transition-transform active:scale-95 disabled:opacity-40"
                aria-label="Отправить"
            >
                <Send className="h-4 w-4" />
            </button>
        </div>
    )
}