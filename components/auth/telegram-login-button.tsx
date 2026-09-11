'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { toast } from 'sonner'

declare global {
    interface Window {
        Telegram?: {
            Login?: {
                auth: (
                    options: { client_id: number; scope?: string[]; lang?: string },
                    callback: (data: { id_token?: string; error?: string }) => void
                ) => void
            }
        }
    }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID || '8915544846'

export function TelegramLoginButton({ className }: { className?: string }) {
    const [sdkReady, setSdkReady] = useState(false)
    const [loading, setLoading] = useState(false)
    const scriptLoaded = useRef(false)

    // Загружаем официальную библиотеку Telegram OIDC
    useEffect(() => {
        if (scriptLoaded.current) return
        scriptLoaded.current = true

        const script = document.createElement('script')
        script.src = 'https://oauth.telegram.org/js/telegram-login.js?6'
        script.async = true
        script.onload = () => setSdkReady(true)
        script.onerror = () => console.error('[TG OIDC] Failed to load telegram-login.js')
        document.body.appendChild(script)

        return () => {
            script.remove()
        }
    }, [])

    const handleTgLogin = () => {
        if (!window.Telegram?.Login) {
            toast.error('Telegram SDK загружается, попробуйте через секунду')
            return
        }

        setLoading(true)

        window.Telegram.Login.auth(
            {
                client_id: Number(CLIENT_ID),
                scope: ['profile'],
                lang: 'ru',
            },
            async (data) => {
                if (data.error) {
                    setLoading(false)
                    if (data.error !== 'user_declined') {
                        toast.error(`Ошибка входа: ${data.error}`)
                    }
                    return
                }

                if (!data.id_token) {
                    setLoading(false)
                    toast.error('Не получен токен авторизации Telegram')
                    return
                }

                try {
                    // Отправляем id_token на наш сервер
                    const res = await fetch('/api/auth/telegram', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_token: data.id_token }),
                    })

                    const result = await res.json()

                    if (!res.ok || !result.redirectUrl) {
                        toast.error(result.error || 'Ошибка проверки авторизации')
                        setLoading(false)
                        return
                    }

                    // Мгновенный переход на /home после успешной авторизации!
                    window.location.href = result.redirectUrl
                } catch {
                    toast.error('Ошибка сети при входе')
                    setLoading(false)
                }
            }
        )
    }

    return (
        <button
            type="button"
            onClick={handleTgLogin}
            disabled={!sdkReady || loading}
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