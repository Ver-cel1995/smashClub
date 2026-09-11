'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { toast } from 'sonner'
import { loginWithDevTelegram } from '@/app/(auth)/telegram-actions'

const CLIENT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID || '8915544846'

export function TelegramLoginButton({ className }: { className?: string }) {
    const [loading, setLoading] = useState(false)

    const handleTgLogin = async () => {
        const isLocalhost = typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

        setLoading(true)

        if (isLocalhost) {
            try {
                const res = await loginWithDevTelegram()
                if (res.success && res.data?.redirectUrl) {
                    window.location.href = res.data.redirectUrl
                } else {
                    toast.error('Ошибка Dev входа')
                    setLoading(false)
                }
            } catch {
                setLoading(false)
            }
            return
        }

        const origin = window.location.origin
        const redirectUri = `${origin}/auth/telegram/callback`
        const state = Math.random().toString(36).substring(2)
        sessionStorage.setItem('tg_oauth_state', state)

        const oauthUrl =
            `https://oauth.telegram.org/auth` +
            `?client_id=${encodeURIComponent(CLIENT_ID)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=openid%20profile` +
            `&state=${encodeURIComponent(state)}`

        // Открываем в текущем окне для надежности PWA
        window.location.href = oauthUrl
    }

    return (
        <button
            type="button"
            onClick={handleTgLogin}
            disabled={loading}
            className={cn(
                'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                'bg-[#2AABEE] text-white shadow-card transition-all active:scale-95',
                'hover:bg-[#229ED9] disabled:opacity-50',
                className
            )}
        >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
    )
}