import { NextRequest, NextResponse } from 'next/server'
import { verifyTelegramWidgetAuth } from '@/shared/lib/telegram/verify-widget'
import { createAdminClient } from '@/shared/lib/supabase/admin'

export async function GET(req: NextRequest) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
        return NextResponse.redirect(`${appUrl}/login?error=tg_not_configured`)
    }

    const { searchParams } = req.nextUrl
    const data: Record<string, string> = {}
    searchParams.forEach((value, key) => {
        data[key] = value
    })

    // 1. Проверяем HMAC подпись Telegram
    const verified = verifyTelegramWidgetAuth(data, botToken)
    if (!verified.ok) {
        console.error('[TG Auth GET Error]', verified.error)
        return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(verified.error)}`)
    }

    const tgUser = verified.user
    const providerUserId = String(tgUser.id)
    const supabaseAdmin = createAdminClient()

    // 2. Ищем или создаём пользователя
    const { data: existingOauth } = await supabaseAdmin
        .from('oauth_accounts')
        .select('user_id')
        .eq('provider', 'telegram')
        .eq('provider_user_id', providerUserId)
        .maybeSingle()

    let userId = existingOauth?.user_id
    const fakeEmail = `tg_${tgUser.id}@smashclub.pwa`
    const fullName =
        [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') ||
        tgUser.username ||
        'Игрок Telegram'

    if (!userId) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        const found = list?.users?.find((u) => u.email === fakeEmail)

        if (found) {
            userId = found.id
        } else {
            const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                email: fakeEmail,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName,
                    avatar_url: tgUser.photo_url,
                },
            })

            if (createErr || !created.user) {
                return NextResponse.redirect(`${appUrl}/login?error=user_create_failed`)
            }
            userId = created.user.id
        }

        await supabaseAdmin.from('profiles').upsert({
            id: userId,
            full_name: fullName,
            avatar_url: tgUser.photo_url || null,
            role: 'player',
            city: 'kushchevskaya',
        } as any)
    }

    await supabaseAdmin.from('oauth_accounts').upsert(
        {
            user_id: userId,
            provider: 'telegram',
            provider_user_id: providerUserId,
            provider_username: tgUser.username || null,
            provider_first_name: tgUser.first_name || null,
            provider_last_name: tgUser.last_name || null,
            provider_avatar_url: tgUser.photo_url || null,
        } as any,
        { onConflict: 'provider,provider_user_id' }
    )

    // 3. Создаём ссылку сессии через token_hash
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: fakeEmail,
        options: { redirectTo: `${appUrl}/auth/callback` },
    })

    const hashedToken = linkData?.properties?.hashed_token
    if (linkErr || !hashedToken) {
        return NextResponse.redirect(`${appUrl}/login?error=session_create_failed`)
    }

    const redirectUrl = `${appUrl}/auth/callback?token_hash=${encodeURIComponent(
        hashedToken
    )}&type=magiclink&next=${encodeURIComponent('/home')}`

    // 4. Закрываем всплывающее окно и перенаправляем основную вкладку на /home
    const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><title>Авторизация...</title></head>
  <body style="background:#0f131d;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
    <script>
      (function() {
        var targetUrl = ${JSON.stringify(redirectUrl)};
        if (window.opener && !window.opener.closed) {
          window.opener.location.href = targetUrl;
          window.close();
        } else {
          window.location.href = targetUrl;
        }
      })();
    </script>
    <p>Авторизация успешна! Переходим в приложение...</p>
  </body>
</html>`

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}