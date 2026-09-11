'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { toast } from 'sonner'
import { loginWithDevTelegram } from '@/app/(auth)/telegram-actions'

const BOT_ID = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || '8915544846'

export function TelegramLoginButton({ className }: { className?: string }) {
    const [loading, setLoading] = useState(false)
    const pollTimerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        return () => {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current)
        }
    }, [])

    const handleTgLogin = async () => {
        setLoading(true)

        try {
            const isLocalhost =
                typeof window !== 'undefined' &&
                (window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1')

            // 1. НА LOCALHOST: Мгновенный Dev-вход за 1 секунду
            if (isLocalhost) {
                const res = await loginWithDevTelegram()
                if (res.success && res.data?.redirectUrl) {
                    toast.success('Dev-вход через Telegram выполнен!')
                    window.location.href = res.data.redirectUrl
                    return
                } else {
                    toast.error('Ошибка Dev входа')
                    setLoading(false)
                    return
                }
            }

            // 2. НА ПРОДАКШЕНЕ: Динамический origin + Всплывающее окно (Popup)
            const origin = window.location.origin
            const returnTo = `${origin}/api/auth/telegram`

            const oauthUrl =
                `https://oauth.telegram.org/auth` +
                `?bot_id=${encodeURIComponent(BOT_ID)}` +
                `&origin=${encodeURIComponent(origin)}` +
                `&embed=0` +
                `&request_access=write` +
                `&return_to=${encodeURIComponent(returnTo)}`

            const width = 550
            const height = 470
            const left = Math.max(0, (window.innerWidth - width) / 2 + window.screenX)
            const top = Math.max(0, (window.innerHeight - height) / 2 + window.screenY)

            const popup = window.open(
                oauthUrl,
                'telegram_oauth',
                `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0`
            )

            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                // Если браузер заблокировал всплывающее окно — редиректим в текущей вкладке
                window.location.href = oauthUrl
                return
            }

            // Отслеживаем закрытие модального окна вручную
            pollTimerRef.current = setInterval(() => {
                if (popup.closed) {
                    if (pollTimerRef.current) clearInterval(pollTimerRef.current)
                    setLoading(false)
                }
            }, 500)
        } catch {
            toast.error('Ошибка входа')
            setLoading(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleTgLogin}
            disabled={loading}
            title="Войти через Telegram"
            aria-label="Войти через Telegram"
            className={cn(
                'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                'bg-[#2AABEE] text-white shadow-card',
                'transition-all duration-150 hover:bg-[#229ED9] hover:scale-105 active:scale-95',
                'disabled:opacity-50 disabled:pointer-events-none',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2AABEE]/60',
                className
            )}
        >
            {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <Send className="h-5 w-5 -translate-x-0.5 translate-y-0.5" strokeWidth={2.25} />
            )}
        </button>
    )
}