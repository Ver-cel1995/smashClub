import { NextRequest, NextResponse } from 'next/server'
import { verifyTelegramIdToken } from '@/shared/lib/telegram/verify-id-token'
import {completeTelegramLoginFromClaims} from "@/shared/lib/telegram/complete-login";

export async function GET(req: NextRequest) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smash-club-three.vercel.app'
    const { searchParams } = req.nextUrl

    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error || !code) {
        return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(error || 'no_code')}`)
    }

    const clientId = process.env.TELEGRAM_CLIENT_ID || process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID || '8915544846'
    const clientSecret = process.env.TELEGRAM_CLIENT_SECRET
    const redirectUri = `${appUrl}/auth/telegram/callback`

    try {
        // 1. Обмениваем code на id_token в Telegram
        const basicAuth = Buffer.from(`${clientId}:${clientSecret || ''}`).toString('base64')

        const tokenRes = await fetch('https://oauth.telegram.org/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: clientId,
            }),
        })

        const tokenData = await tokenRes.json()

        if (!tokenRes.ok || !tokenData.id_token) {
            console.error('[TG Callback Exchange Error]', tokenData)
            return NextResponse.redirect(`${appUrl}/login?error=token_exchange_failed`)
        }

        // 2. Валидируем полученный id_token
        const verification = await verifyTelegramIdToken(tokenData.id_token, clientId)
        if (!verification.ok) {
            return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(verification.error)}`)
        }

        // 3. Авторизуем/регистрируем пользователя в Supabase
        const result = await completeTelegramLoginFromClaims(verification.payload)
        if (!result.ok) {
            return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(result.error)}`)
        }

        // 4. Переходим на /auth/callback для установки кук сессии
        return NextResponse.redirect(result.redirectUrl)
    } catch (err) {
        console.error('[TG Callback Error]', err)
        return NextResponse.redirect(`${appUrl}/login?error=server_error`)
    }
}