'use client'

import { useState } from 'react'
import { Share2, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'

type ShareData = {
    title: string
    text?: string
    url: string
}

type Props = {
    data: ShareData
    /** Стиль кнопки: default — как обычная кнопка, icon — только иконка */
    variant?: 'default' | 'icon'
    /** Кастомный текст (по умолчанию «Поделиться») */
    label?: string
    className?: string
}

export function ShareButton({
                                data,
                                variant = 'default',
                                label = 'Поделиться',
                                className,
                            }: Props) {
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleClick = async () => {
        setLoading(true)
        try {
            // Web Share API — работает на мобильных
            if (typeof navigator !== 'undefined' && navigator.share) {
                try {
                    await navigator.share({
                        title: data.title,
                        text: data.text,
                        url: data.url,
                    })
                    // Не показываем toast — юзер сам увидит нативный UI
                    return
                } catch (err) {
                    // Если юзер отменил share — просто выходим тихо
                    if (err instanceof Error && err.name === 'AbortError') {
                        return
                    }
                    // Иначе fallback на копирование
                    console.warn('Share failed, falling back to clipboard:', err)
                }
            }

            // Fallback: копируем в буфер
            const textToCopy = data.text
                ? `${data.title}\n${data.text}\n${data.url}`
                : `${data.title}\n${data.url}`

            await copyToClipboard(textToCopy)
            setCopied(true)
            toast.success('Ссылка скопирована')
            setTimeout(() => setCopied(false), 2500)
        } catch (err) {
            console.error('Share error:', err)
            toast.error('Не удалось поделиться')
        } finally {
            setLoading(false)
        }
    }

    if (variant === 'icon') {
        return (
            <button
                type="button"
                onClick={handleClick}
                disabled={loading}
                aria-label={label}
                className={cn(
                    'rounded-lg p-2 text-muted hover:bg-hover hover:text-strong transition-colors',
                    className
                )}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : copied ? (
                    <Check className="h-4 w-4 text-success" />
                ) : (
                    <Share2 className="h-4 w-4" />
                )}
            </button>
        )
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className={cn(
                'inline-flex items-center gap-2 rounded-xl border border-card bg-subtle px-3 py-2 text-sm font-medium text-main transition-colors hover:border-strong hover:bg-hover',
                className
            )}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : copied ? (
                <>
                    <Check className="h-4 w-4 text-success" />
                    Скопировано
                </>
            ) : (
                <>
                    <Share2 className="h-4 w-4" />
                    {label}
                </>
            )}
        </button>
    )
}

/**
 * Копирование в буфер обмена с fallback для старых браузеров.
 */
async function copyToClipboard(text: string): Promise<void> {
    // Современный Clipboard API (нужен HTTPS)
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text)
            return
        } catch {
            // Fallback ниже
        }
    }

    // Fallback через textarea + execCommand
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    try {
        document.execCommand('copy')
    } finally {
        document.body.removeChild(textarea)
    }
}