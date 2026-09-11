import {NextRequest, NextResponse} from 'next/server'
import {verifyTelegramIdToken} from '@/shared/lib/telegram/verify-id-token'
import {completeTelegramLoginFromClaims} from "@/shared/lib/telegram/complete-login";

export async function GET(req: NextRequest) {
    const { searchParams, origin } = req.nextUrl
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error || !code) {
        return NextResponse.redirect(`${origin}/login?error=tg_no_code`)
    }

    const clientId = process.env.TELEGRAM_CLIENT_ID || '8915544846'
    const clientSecret = process.env.TELEGRAM_CLIENT_SECRET
    const redirectUri = `${origin}/auth/telegram/callback`

    try {
        // 1. Обмениваем код на токены (OIDC стандарт)
        const authHeader = Buffer.from(`${clientId}:${clientSecret || ''}`).toString('base64')

        const tokenRes = await fetch('https://oauth.telegram.org/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${authHeader}`,
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
            console.error('[TG OIDC Error]', tokenData)
            return NextResponse.redirect(`${origin}/login?error=token_failed`)
        }

        // 2. Проверяем JWT токен Telegram
        const verified = await verifyTelegramIdToken(tokenData.id_token, clientId)
        if (!verified.ok) {
            return NextResponse.redirect(`${origin}/login?error=invalid_token`)
        }

        // 3. Создаем/ищем пользователя в Supabase
        const result = await completeTelegramLoginFromClaims(verified.payload)

        if (!result.ok) {
            return NextResponse.redirect(`${origin}/login?error=auth_failed`)
        }

        // 4. Редирект на установку кук и домой
        return NextResponse.redirect(result.redirectUrl)
    } catch (err) {
        console.error('[TG Callback Crash]', err)
        return NextResponse.redirect(`${origin}/login?error=server_error`)
    }
}