'use server'

import { createAdminClient } from '@/shared/lib/supabase/admin'
import type { ActionResult } from '@/shared/lib/actions/types'
import { verifyTelegramWidgetAuth } from '@/shared/lib/telegram/verify-widget'

type TgUser = {
    id: number
    first_name?: string
    last_name?: string
    username?: string
}

/**
 * Подтверждение входа пользователя Telegram и создание сессии в Supabase
 */
export async function verifyTelegramLogin(code: string, tgUser: TgUser) {
    const supabaseAdmin = createAdminClient()

    const { data: authCode } = await supabaseAdmin
        .from('auth_codes')
        .select('*')
        .eq('code', code)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

    if (!authCode) {
        return { ok: false, error: 'Код не найден или истёк' }
    }

    const providerUserId = String(tgUser.id)

    const { data: existingOauth } = await supabaseAdmin
        .from('oauth_accounts')
        .select('user_id')
        .eq('provider', 'telegram')
        .eq('provider_user_id', providerUserId)
        .maybeSingle()

    let userId = existingOauth?.user_id as string | undefined
    const fullName =
        [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') ||
        tgUser.username ||
        'Игрок Telegram'

    const fakeEmail = `tg_${tgUser.id}@smashclub.pwa`

    if (!userId) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        const found = list?.users?.find((u) => u.email === fakeEmail)

        if (found) {
            userId = found.id
        } else {
            const { data: created, error: createErr } =
                await supabaseAdmin.auth.admin.createUser({
                    email: fakeEmail,
                    email_confirm: true,
                    user_metadata: { full_name: fullName },
                })

            if (createErr || !created.user) {
                console.error('[verifyTelegramLogin] createUser error:', createErr)
                return { ok: false, error: 'Ошибка создания пользователя' }
            }
            userId = created.user.id
        }

        await supabaseAdmin.from('profiles').upsert({
            id: userId,
            full_name: fullName,
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
        } as any,
        { onConflict: 'provider,provider_user_id' }
    )

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smash-club-three.vercel.app'
    const { data: linkData, error: linkErr } =
        await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: fakeEmail,
            options: { redirectTo: `${appUrl}/auth/callback` },
        })

    const hashedToken = linkData?.properties?.hashed_token
    if (linkErr || !hashedToken) {
        return { ok: false, error: 'Ошибка создания ссылки входа' }
    }

    const redirectUrl = `${appUrl}/auth/callback?token_hash=${encodeURIComponent(
        hashedToken
    )}&type=magiclink&next=${encodeURIComponent('/home')}`

    await supabaseAdmin
        .from('auth_codes')
        .update({
            status: 'verified',
            user_id: userId,
            provider_user_id: providerUserId,
            provider_data: { redirect_url: redirectUrl },
        } as any)
        .eq('id', authCode.id)

    return { ok: true }
}

/**
 * Мгновенный Dev-вход для локальной разработки (localhost)
 */
export async function loginWithDevTelegram(): Promise<
    ActionResult<{ redirectUrl: string }>
> {
    const fakeTgUser = {
        id: 77712345,
        first_name: 'Алексей',
        last_name: '(Dev Telegram)',
        username: 'alexey_dev',
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const supabaseAdmin = createAdminClient()

    await supabaseAdmin.from('auth_codes').insert({
        code,
        provider: 'telegram',
        status: 'pending',
        expires_at: new Date(Date.now() + 60000).toISOString(),
    })

    const result = await verifyTelegramLogin(code, fakeTgUser)

    if (!result.ok) {
        return { success: false, error: 'Не удалось выполнить Dev вход' }
    }

    const { data: authCode } = await supabaseAdmin
        .from('auth_codes')
        .select('provider_data')
        .eq('code', code)
        .single()

    const redirectUrl = (authCode?.provider_data as any)?.redirect_url

    if (!redirectUrl) {
        return { success: false, error: 'Не найдена ссылка сессии' }
    }

    return {
        success: true,
        data: { redirectUrl },
    }
}