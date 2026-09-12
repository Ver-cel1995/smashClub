import { NextResponse } from 'next/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { sendMaxMessage } from '@/shared/lib/max/bot-api';

export async function POST(req: Request) {
    try {
        const textData = await req.text();
        let body;

        try {
            body = JSON.parse(textData);
        } catch (e) {
            console.error('[MAX Webhook] Failed to parse JSON:', textData);
            return NextResponse.json({ ok: true, note: 'JSON parse fail' });
        }

        // Извлекаем текст сообщения и данные пользователя из webhook
        const message = body?.message || body?.object || body;
        const text: string = message?.text || message?.body || '';
        const fromUser = message?.from || message?.user || body?.user;

        if (!fromUser || !fromUser.id) {
            return NextResponse.json({ ok: true, note: 'No user info' });
        }

        // Ищем 6-значный код из команды "/start 123456"
        const match = text.match(/\b(\d{6})\b/);
        if (!match) {
            // Если это просто обычное сообщение боту
            await sendMaxMessage(
                fromUser.id,
                '👋 Привет! Чтобы войти в SmashClub, нажмите кнопку «Войти через МАХ» на сайте приложения.'
            );
            return NextResponse.json({ ok: true });
        }

        const code = match[1];
        const maxUserId = String(fromUser.id);
        const firstName = fromUser.first_name || 'Игрок';
        const lastName = fromUser.last_name || '';
        const username = fromUser.username || null;
        const fullName = `${firstName} ${lastName}`.trim();
        const avatarUrl = fromUser.avatar_url || fromUser.photo_url || null;

        const supabaseAdmin = createAdminClient();

        // 1. Ищем активный код авторизации
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
                'Код авторизации не найден или его срок действия (5 мин) истёк. Попробуйте снова на сайте.'
            );
            return NextResponse.json({ ok: true, note: 'Code not found or expired' });
        }

        let userId: string;

        // 2. Ищем существующий привязанный аккаунт в oauth_accounts
        const { data: existingOauth } = await supabaseAdmin
            .from('oauth_accounts')
            .select('user_id')
            .eq('provider', 'max')
            .eq('provider_user_id', maxUserId)
            .maybeSingle();

        if (existingOauth?.user_id) {
            userId = existingOauth.user_id;
        } else {
            // 3. Если аккаунта нет — создаём новый через Supabase Admin API
            const syntheticEmail = `max_${maxUserId}@smashclub.pwa`;

            // Проверяем, может user с таким email уже есть
            const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
            const matchedUser = existingUser?.users?.find((u) => u.email === syntheticEmail);

            if (matchedUser) {
                userId = matchedUser.id;
            } else {
                // Создаём нового пользователя
                const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                    email: syntheticEmail,
                    email_confirm: true,
                    user_metadata: { full_name: fullName, avatar_url: avatarUrl },
                });

                if (createErr || !newUser.user) {
                    console.error('[MAX Webhook] Ошибка создания пользователя:', createErr);
                    await sendMaxMessage(fromUser.id, 'Ошибка создания аккаунта. Обратитесь в поддержку.');
                    return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
                }

                userId = newUser.user.id;

                // Создаём профиль
                await supabaseAdmin.from('profiles').upsert({
                    id: userId,
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    role: 'player',
                });
            }

            // Привязываем записи в oauth_accounts
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

        // 4. Генерируем ссылку для автоматического входа
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smash-club-three.vercel.app';
        const syntheticEmail = `max_${maxUserId}@smashclub.pwa`;

        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: syntheticEmail,
            options: {
                redirectTo: `${appUrl}/auth/callback?next=/home`,
            },
        });

        if (linkErr || !linkData?.properties?.action_link) {
            console.error('[MAX Webhook] Ошибка генерации ссылки входа:', linkErr);
            await sendMaxMessage(fromUser.id, 'Ошибка авторизации. Попробуйте ещё раз.');
            return NextResponse.json({ error: 'Magic link failed' }, { status: 500 });
        }

        // 5. Обновляем статус кода в БД на 'verified'
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

        // 6. Уведомляем пользователя в мессенджере МАХ
        await sendMaxMessage(
            fromUser.id,
            `Вы успешно вошли в SmashClub как ${fullName}!\n\nМожете вернуться в браузер — приложение открывается автоматически.`
        );

        return NextResponse.json({ ok: true, verified: true });
    } catch (err: any) {
        console.error('[MAX Webhook] Exception:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}