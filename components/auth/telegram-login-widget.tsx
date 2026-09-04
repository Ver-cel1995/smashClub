'use client'

import { useEffect, useRef } from 'react'

type Props = {
    /** origin без слэша на конце */
    authUrl?: string
    botUsername?: string
    cornerRadius?: number
}

/**
 * https://core.telegram.org/widgets/login
 */
export function TelegramLoginWidget({
                                        botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'SmashClubAuthBot',
                                        authUrl,
                                        cornerRadius = 12,
                                    }: Props) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        el.innerHTML = ''

        const origin =
            typeof window !== 'undefined'
                ? window.location.origin
                : 'https://smash-club-three.vercel.app'

        const callback =
            authUrl || `${origin}/api/auth/telegram`

        const script = document.createElement('script')
        script.src = 'https://telegram.org/js/telegram-widget.js?22'
        script.async = true
        script.setAttribute('data-telegram-login', botUsername.replace(/^@/, ''))
        script.setAttribute('data-size', 'large')
        script.setAttribute('data-radius', String(cornerRadius))
        script.setAttribute('data-auth-url', callback)
        script.setAttribute('data-request-access', 'write')

        el.appendChild(script)

        return () => {
            el.innerHTML = ''
        }
    }, [botUsername, authUrl, cornerRadius])

    return (
        <div className="flex w-full flex-col items-center gap-2">
            <div ref={ref} className="flex min-h-[40px] w-full justify-center" />
            <p className="text-[10px] text-muted text-center">
                Вход через Telegram · @
                {botUsername.replace(/^@/, '')}
            </p>
        </div>
    )
}