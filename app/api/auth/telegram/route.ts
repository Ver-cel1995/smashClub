import { NextRequest, NextResponse } from 'next/server'
import { verifyTelegramWidgetAuth } from '@/shared/lib/telegram/verify-widget'
import { completeTelegramLogin } from '@/shared/lib/telegram/complete-login'

/**
 * Telegram Login Widget шлёт GET с query:
 * id, first_name, last_name, username, photo_url, auth_date, hash
 * https://core.telegram.org/widgets/login
 */
export async function GET(req: NextRequest) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smash-club-three.vercel.app'
    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
        return NextResponse.redirect(`${appUrl}/login?error=tg_not_configured`)
    }

    const sp = req.nextUrl.searchParams
    const data: Record<string, string> = {}
    sp.forEach((value, key) => {
        data[key] = value
    })

    const verified = verifyTelegramWidgetAuth(data, botToken)
    if (!verified.ok) {
        console.error('[api/auth/telegram]', verified.error)
        return NextResponse.redirect(
            `${appUrl}/login?error=${encodeURIComponent(verified.error)}`
        )
    }

    // Опционально: ?link=1 + cookie сессии — привязка (расширишь позже)
    const result = await completeTelegramLogin(verified.user)

    if (!result.ok) {
        return NextResponse.redirect(
            `${appUrl}/login?error=${encodeURIComponent(result.error)}`
        )
    }

    // 302 на /auth/callback?token_hash=... → cookies → /home
    return NextResponse.redirect(result.redirectUrl)
}