import { NextRequest, NextResponse } from 'next/server'
import { verifyTelegramIdToken } from '@/shared/lib/telegram/verify-id-token'
import { createAdminClient } from '@/shared/lib/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { id_token } = body

        if (!id_token) {
            return NextResponse.json({ error: 'Токен не передан' }, { status: 400 })
        }

        const clientId = process.env.TELEGRAM_CLIENT_ID || process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID || '8915544846'

        // 1. Проверяем JWT подпись Telegram
        const verification = await verifyTelegramIdToken(id_token, clientId)
        if (!verification.ok) {
            return NextResponse.json({ error: verification.error }, { status: 401 })
        }

        const tgUser = verification.payload
        const tgId = tgUser.id || Number(tgUser.sub)
        const providerUserId = String(tgId)

        const supabaseAdmin = createAdminClient()
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smash-club-three.vercel.app'

        // 2. Ищем существующую привязку в oauth_accounts
        const { data: existingOauth } = await supabaseAdmin
            .from('oauth_accounts')
            .select('user_id')
            .eq('provider', 'telegram')
            .eq('provider_user_id', providerUserId)
            .maybeSingle()

        let userId = existingOauth?.user_id
        const fakeEmail = `tg_${tgId}@telegram.smashclub.local`

        const fullName =
            tgUser.name ||
            [tgUser.given_name, tgUser.family_name].filter(Boolean).join(' ') ||
            tgUser.preferred_username ||
            'Игрок Telegram'

        // 3. Если пользователя нет — создаём
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
                        telegram_id: tgId,
                        avatar_url: tgUser.picture,
                    },
                })

                if (createErr || !created.user) {
                    console.error('[TG Auth API] createUser error:', createErr)
                    return NextResponse.json({ error: 'Не удалось создать аккаунт' }, { status: 500 })
                }
                userId = created.user.id
            }

            // Создаём профиль
            await supabaseAdmin.from('profiles').upsert({
                id: userId,
                full_name: fullName,
                avatar_url: tgUser.picture || null,
                role: 'player',
                city: 'kushchevskaya',
            } as any)
        }

        // Сохраняем связку в oauth_accounts
        await supabaseAdmin.from('oauth_accounts').upsert(
            {
                user_id: userId,
                provider: 'telegram',
                provider_user_id: providerUserId,
                provider_username: tgUser.preferred_username || null,
                provider_first_name: tgUser.given_name || null,
                provider_last_name: tgUser.family_name || null,
                provider_avatar_url: tgUser.picture || null,
            } as any,
            { onConflict: 'provider,provider_user_id' }
        )

        // 4. Генерируем безопасную сессию через token_hash (без ошметков #access_token)
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
        const userEmail = authUser.user?.email || fakeEmail

        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: userEmail,
            options: { redirectTo: `${appUrl}/auth/callback` },
        })

        const hashedToken = linkData?.properties?.hashed_token
        if (linkErr || !hashedToken) {
            return NextResponse.json({ error: 'Не удалось создать сессию входа' }, { status: 500 })
        }

        const redirectUrl = `${appUrl}/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink&next=${encodeURIComponent('/home')}`

        return NextResponse.json({ redirectUrl })
    } catch (err) {
        console.error('[TG Auth API Error]', err)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}