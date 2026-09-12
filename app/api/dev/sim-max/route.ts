import { NextResponse } from 'next/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';

// симулятор входа через MAX для localhost

export async function GET(req: Request) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Dev simulator disabled in production' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Имитируем входящие данные пользователя из MAX
    const testMaxUserId = 'dev_max_999999';
    const fullName = 'Тестовый Игрок (МАХ)';
    const syntheticEmail = `max_${testMaxUserId}@smashclub.pwa`;

    // Ищем или создаём пользователя
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    let user = users?.users?.find((u) => u.email === syntheticEmail);

    if (!user) {
        const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
            email: syntheticEmail,
            email_confirm: true,
            user_metadata: { full_name: fullName },
        });
        user = newUser.user!;

        await supabaseAdmin.from('profiles').upsert({
            id: user.id,
            full_name: fullName,
            role: 'player',
        });

        await supabaseAdmin.from('oauth_accounts').insert({
            user_id: user.id,
            provider: 'max',
            provider_user_id: testMaxUserId,
            provider_first_name: 'Тестовый',
            provider_last_name: 'Игрок',
        });
    }

    // Генерируем ссылку
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: syntheticEmail,
        options: { redirectTo: `${appUrl}/auth/callback?next=/home` },
    });

    // Помечаем код как подтверждённый
    await supabaseAdmin
        .from('auth_codes')
        .update({
            status: 'verified',
            user_id: user.id,
            provider_data: { action_link: linkData.properties?.action_link },
        })
        .eq('code', code)
        .eq('provider', 'max');

    return NextResponse.json({ success: true, code, user_id: user.id });
}