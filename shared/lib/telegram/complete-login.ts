import { createAdminClient } from '@/shared/lib/supabase/admin'
import type { TelegramWidgetUser } from './verify-widget'

export async function completeTelegramLogin(
    tg: TelegramWidgetUser,
    options?: {
        /** если уже залогинен — только привязка к этому user_id */
        linkToUserId?: string | null
    }
): Promise<{ ok: true; redirectUrl: string } | { ok: false; error: string }> {
    const supabaseAdmin = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smash-club-three.vercel.app'
    const providerUserId = String(tg.id)

    const fullName =
        [tg.first_name, tg.last_name].filter(Boolean).join(' ') ||
        tg.username ||
        'Игрок Telegram'

    // 1) Уже привязанный Telegram?
    const { data: existingOauth } = await supabaseAdmin
        .from('oauth_accounts')
        .select('user_id')
        .eq('provider', 'telegram')
        .eq('provider_user_id', providerUserId)
        .maybeSingle()

    let userId = options?.linkToUserId || existingOauth?.user_id || null

    // 2) Новый пользователь
    if (!userId) {
        const fakeEmail = `tg_${tg.id}@telegram.smashclub.local`

        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        const found = list?.users?.find((u) => u.email === fakeEmail)

        if (found) {
            userId = found.id
        } else {
            const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
                email: fakeEmail,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName,
                    telegram_id: tg.id,
                    avatar_url: tg.photo_url,
                },
            })
            if (error || !created.user) {
                console.error('[completeTelegramLogin] createUser', error)
                return { ok: false, error: 'Не удалось создать аккаунт' }
            }
            userId = created.user.id
        }

        await supabaseAdmin.from('profiles').upsert({
            id: userId,
            full_name: fullName,
            avatar_url: tg.photo_url || null,
            role: 'player',
            city: 'kushchevskaya',
        } as any)
    }

    // 3) oauth_accounts
    await supabaseAdmin.from('oauth_accounts').upsert(
        {
            user_id: userId,
            provider: 'telegram',
            provider_user_id: providerUserId,
            provider_username: tg.username || null,
            provider_first_name: tg.first_name || null,
            provider_last_name: tg.last_name || null,
            provider_avatar_url: tg.photo_url || null,
        } as any,
        { onConflict: 'provider,provider_user_id' }
    )

    // 4) Magic link → наш callback с token_hash (без #access_token)
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    const email = authUser.user?.email
    if (!email) return { ok: false, error: 'У пользователя нет email' }

    const { data: linkData, error: linkErr } =
        await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: { redirectTo: `${appUrl}/auth/callback` },
        })

    const hashed = linkData?.properties?.hashed_token
    if (linkErr || !hashed) {
        console.error('[completeTelegramLogin] generateLink', linkErr)
        return { ok: false, error: 'Не удалось создать сессию' }
    }

    const redirectUrl =
        `${appUrl}/auth/callback` +
        `?token_hash=${encodeURIComponent(hashed)}` +
        `&type=magiclink` +
        `&next=${encodeURIComponent('/home')}`

    return { ok: true, redirectUrl }
}