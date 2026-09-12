import { NextResponse } from 'next/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { sendMaxMessage } from '@/shared/lib/max/bot-api';

export async function POST(req: Request) {
    try {
        const textData = await req.text();
        let body: any;
        try {
            body = JSON.parse(textData);
        } catch (e) {
            return NextResponse.json({ ok: true });
        }

        console.log('[MAX Webhook Payload]:', JSON.stringify(body, null, 2));

        // 1. Извлекаем данные пользователя из любых возможных структур МАХ Update
        const message = body?.message || body?.object?.message || body?.object || body;
        const fromUser =
            message?.from ||
            body?.user ||
            body?.object?.user ||
            message?.user;

        if (!fromUser || !fromUser.id) {
            return NextResponse.json({ ok: true, note: 'No user data' });
        }

        // 2. Ищем 6-значный код В ЛЮБОМ МЕСТЕ payload / текста
        // МАХ передает deep-link код в payload, start_param или text ("/start 123456")
        const possibleSources = [
            body?.payload,
            body?.object?.payload,
            body?.start_param,
            message?.text,
            message?.body,
            textData, // Поиск по всему исходному JSON на случай кастомной структуры
        ];

        let code: string | null = null;
        for (const src of possibleSources) {
            if (typeof src === 'string') {
                const match = src.match(/\b(\d{6})\b/);
                if (match) {
                    code = match[1];
                    break;
                }
            }
        }

        // Если код не найден — просто приветствуем пользователя
        if (!code) {
            await sendMaxMessage(
                fromUser.id,
                '👋 Чтобы зайти в SmashClub, нажмите кнопку «Войти через МАХ» на сайте приложения.'
            );
            return NextResponse.json({ ok: true, note: 'No auth code found' });
        }

        const maxUserId = String(fromUser.id);
        const firstName = fromUser.first_name || 'Игрок';
        const lastName = fromUser.last_name || '';
        const username = fromUser.username || null;
        const fullName = `${firstName} ${lastName}`.trim();
        const avatarUrl = fromUser.avatar_url || fromUser.photo_url || null;

        const supabaseAdmin = createAdminClient();

        // 3. Ищем активный код авторизации в базе
        const { data: authCode, error: codeErr } = await supabaseAdmin
            .from('auth_codes')
            .select('*')
            .eq('code', code)
            .eq('provider', 'max')
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (codeErr || !authCode) {
            await sendMaxMessage(
                fromUser.id,
                '❌ Код авторизации устарел. Попробуйте нажать «Войти через МАХ» ещё раз.'
            );
            return NextResponse.json({ ok: true, note: 'Invalid or expired code' });
        }

        let userId: string;

        // 4. Ищем или создаём профиль в единой системе аккаунтов SmashClub
        const { data: existingOauth } = await supabaseAdmin
            .from('oauth_accounts')
            .select('user_id')
            .eq('provider', 'max')
            .eq('provider_user_id', maxUserId)
            .maybeSingle();

        if (existingOauth?.user_id) {
            userId = existingOauth.user_id;
        } else {
            const syntheticEmail = `max_${maxUserId}@smashclub.pwa`;
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
            const matchedUser = existingUsers?.users?.find((u) => u.email === syntheticEmail);

            if (matchedUser) {
                userId = matchedUser.id;
            } else {
                const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                    email: syntheticEmail,
                    email_confirm: true,
                    user_metadata: { full_name: fullName, avatar_url: avatarUrl },
                });

                if (createErr || !newUser.user) {
                    await sendMaxMessage(fromUser.id, '❌ Ошибка создания профиля.');
                    return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
                }

                userId = newUser.user.id;

                await supabaseAdmin.from('profiles').upsert({
                    id: userId,
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    role: 'player',
                });
            }

            await supabaseAdmin.from('oauth_accounts').insert({
                user_id: userId,
                provider: 'max',
                provider_user_id: maxUserId,
                provider_username: username,
                provider_first_name: firstName,
                provider_last_name: lastName,
                provider_avatar_url: avatarUrl,
            });
        }

        // 5. Генерируем ссылку беспарольного входа для браузера
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smash-club-three.vercel.app';
        const syntheticEmail = `max_${maxUserId}@smashclub.pwa`;

        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: syntheticEmail,
            options: { redirectTo: `${appUrl}/auth/callback?next=/home` },
        });

        if (linkErr || !linkData?.properties?.action_link) {
            return NextResponse.json({ error: 'Magic link generation failed' }, { status: 500 });
        }

        // 6. Подтверждаем код — браузер пользователя на сайте МГНОВЕННО залогинится!
        await supabaseAdmin
            .from('auth_codes')
            .update({
                status: 'verified',
                user_id: userId,
                provider_data: {
                    action_link: linkData.properties.action_link,
                    max_user_id: maxUserId,
                },
            })
            .eq('id', authCode.id);

        // 7. Сообщаем пользователю в МАХ
        await sendMaxMessage(
            fromUser.id,
            `⚡ Вход выполнен! Добро пожаловать, ${firstName}.\n\nМожете вернуться в браузер — сайт уже открыт.`
        );

        return NextResponse.json({ ok: true, verified: true });
    } catch (err: any) {
        console.error('[MAX Webhook Exception]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}