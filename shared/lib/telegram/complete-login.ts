import { createAdminClient } from '@/shared/lib/supabase/admin'
import {TelegramJwtPayload} from "@/shared/lib/telegram/verify-id-token";

export async function completeTelegramLoginFromClaims(
    claims: TelegramJwtPayload
): Promise<{ ok: true; redirectUrl: string } | { ok: false; error: string }> {
    const supabaseAdmin = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smash-club-three.vercel.app'

    const tgId = claims.id ?? Number(claims.sub)
    if (!tgId || Number.isNaN(tgId)) {
        return { ok: false, error: 'no telegram id' }
    }

    const providerUserId = String(tgId)
    const fullName =
        claims.name ||
        [claims.given_name, claims.family_name].filter(Boolean).join(' ') ||
        claims.preferred_username ||
        'Игрок Telegram'

    const { data: existingOauth } = await supabaseAdmin
        .from('oauth_accounts')
        .select('user_id')
        .eq('provider', 'telegram')
        .eq('provider_user_id', providerUserId)
        .maybeSingle()

    let userId = existingOauth?.user_id as string | undefined
    const fakeEmail = `tg_${tgId}@telegram.smashclub.local`

    if (!userId) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        const found = list?.users?.find((u) => u.email === fakeEmail)

        if (found) userId = found.id
        else {
            const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
                email: fakeEmail,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName,
                    telegram_id: tgId,
                    avatar_url: claims.picture,
                },
            })
            if (error || !created.user) {
                console.error(error)
                return { ok: false, error: 'create user failed' }
            }
            userId = created.user.id
        }

        await supabaseAdmin.from('profiles').upsert({
            id: userId,
            full_name: fullName,
            avatar_url: claims.picture || null,
            role: 'player',
            city: 'kushchevskaya',
        } as any)
    }

    await supabaseAdmin.from('oauth_accounts').upsert(
        {
            user_id: userId,
            provider: 'telegram',
            provider_user_id: providerUserId,
            provider_username: claims.preferred_username || null,
            provider_first_name: claims.given_name || null,
            provider_last_name: claims.family_name || null,
            provider_avatar_url: claims.picture || null,
        } as any,
        { onConflict: 'provider,provider_user_id' }
    )

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    const email = authUser.user?.email
    if (!email) return { ok: false, error: 'no email' }

    const { data: linkData, error: linkErr } =
        await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: { redirectTo: `${appUrl}/auth/callback` },
        })

    const hashed = linkData?.properties?.hashed_token
    if (linkErr || !hashed) {
        return { ok: false, error: 'session link failed' }
    }

    const redirectUrl =
        `${appUrl}/auth/callback` +
        `?token_hash=${encodeURIComponent(hashed)}` +
        `&type=magiclink&next=${encodeURIComponent('/home')}`

    return { ok: true, redirectUrl }
}