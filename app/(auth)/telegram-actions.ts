'use server'

import { createAdminClient } from '@/shared/lib/supabase/admin'
import type { ActionResult } from '@/shared/lib/actions/types'
import { getCurrentUser } from '@/shared/lib/auth'

type TgUser = {
    id: number
    first_name?: string
    last_name?: string
    username?: string
}

async function fetchTelegramQuick(endpoint: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) return null

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)

    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
            method: 'GET',
            signal: controller.signal,
        })
        clearTimeout(timeoutId)
        return await res.json()
    } catch {
        clearTimeout(timeoutId)
        return null
    }
}

export async function verifyTelegramLogin(code: string, tgUser: TgUser) {
    const supabaseAdmin = createAdminClient()

    // 1. Проверяем сессию с кодом
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

    // 2. УМНЫЙ ПОИСК ЕДИНОГО АККАУНТА: Проверяем, привязан ли этот Telegram к существующуему профилю
    const { data: existingOauth } = await supabaseAdmin
        .from('oauth_accounts')
        .select('user_id')
        .eq('provider', 'telegram')
        .eq('provider_user_id', providerUserId)
        .maybeSingle()

    let userId = existingOauth?.user_id as string | undefined

    // 3. Если сессия создана уже ЗАЛОГИНИННЫМ юзером (привязка Telegram в настройках профиля)
    if (!userId && authCode.user_id) {
        userId = authCode.user_id
    }

    const fullName =
        [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') ||
        tgUser.username ||
        'Игрок Telegram'

    const fakeEmail = `tg_${tgUser.id}@smashclub.pwa`

    // 4. Если аккаунта нет вообще — создаём новый
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

        // Создаём профиль
        await supabaseAdmin.from('profiles').upsert({
            id: userId,
            full_name: fullName,
            role: 'player',
            city: 'kushchevskaya',
        } as any)
    }

    // 5. Всегда сохраняем/обновляем связку в oauth_accounts
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

    // 6. Генерируем ссылку входа, указывая наш новый /auth/callback маршрут!
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { data: linkData, error: linkErr } =
        await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: fakeEmail, // email того user_id, в которого входим
            options: {
                redirectTo: `${appUrl}/auth/callback`,
            },
        })

    if (linkErr || !linkData?.properties?.hashed_token) {
        console.error('[verifyTelegramLogin] generateLink', linkErr)
        return { ok: false, error: 'Ошибка создания ссылки входа' }
    }

// 👇 Своя ссылка: сервер получит token_hash в query (не в #hash)
    const redirectUrl =
        `${appUrl}/auth/callback` +
        `?token_hash=${encodeURIComponent(linkData.properties.hashed_token)}` +
        `&type=magiclink` +
        `&next=/home`

    await supabaseAdmin
        .from('auth_codes')
        .update({
            status: 'verified',
            user_id: userId,
            provider_user_id: providerUserId,
            provider_data: { redirect_url: redirectUrl },
        } as any)
        .eq('id', authCode.id)

    // Обновляем статус кода
    await supabaseAdmin
        .from('auth_codes')
        .update({
            status: 'verified',
            user_id: userId,
            provider_user_id: providerUserId,
            provider_data: { redirect_url: linkData.properties.action_link },
        } as any)
        .eq('id', authCode.id)

    return { ok: true }
}

async function drainTelegramUpdates() {
    const json = await fetchTelegramQuick('getUpdates?offset=-5&timeout=0')
    if (!json || !json.ok || !Array.isArray(json.result)) return

    for (const update of json.result) {
        const message = update.message
        if (!message?.text || !message.from) continue

        const text = String(message.text).trim()
        if (!text.startsWith('/start')) continue

        const parts = text.split(/\s+/)
        const code = parts[1]?.trim()

        if (code) {
            await verifyTelegramLogin(code, message.from)
        }
    }
}

export async function createTelegramAuthSession(): Promise<
    ActionResult<{ code: string; botUsername: string; expiresAt: string }>
> {
    const supabaseAdmin = createAdminClient()
    const user = await getCurrentUser() // Если залогинен — запоминаем его ID для привязки!

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const botUsername = (process.env.TELEGRAM_BOT_USERNAME || 'SmashClubAuthBot').replace(/^@/, '')

    const { error } = await supabaseAdmin.from('auth_codes').insert({
        code,
        provider: 'telegram',
        status: 'pending',
        user_id: user?.id || null, // Если игрок залогинен — привязываем к текущему аккаунту
        expires_at: expiresAt,
    })

    if (error) {
        console.error('[createTelegramAuthSession]', error)
        return { success: false, error: 'Ошибка создания сессии' }
    }

    return {
        success: true,
        data: { code, botUsername, expiresAt },
    }
}

export async function checkTelegramAuthSession(code: string): Promise<
    ActionResult<{ verified: boolean; redirectUrl?: string }>
> {
    await drainTelegramUpdates()

    const supabaseAdmin = createAdminClient()

    const { data: authCode } = await supabaseAdmin
        .from('auth_codes')
        .select('*')
        .eq('code', code)
        .maybeSingle()

    if (!authCode) return { success: false, error: 'Сессия не найдена' }

    if (authCode.status === 'verified') {
        const redirectUrl = (authCode.provider_data as any)?.redirect_url
        return {
            success: true,
            data: { verified: true, redirectUrl },
        }
    }

    return { success: true, data: { verified: false } }
}