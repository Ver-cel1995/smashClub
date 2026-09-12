import { NextResponse } from 'next/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        const { initData, code } = await req.json();

        // 1. Парсим initData (здесь должна быть валидация HMAC подписи с MAX_BOT_TOKEN)
        // Для примера вынимаем user_id из строки (в реальности МАХ присылает JSON или query-string)
        const params = new URLSearchParams(initData);
        const userJson = JSON.parse(params.get('user') || '{}');
        const maxUserId = String(userJson.id);

        if (!maxUserId || !code) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

        const supabaseAdmin = createAdminClient();

        // 2. Ищем код в базе
        const { data: authCode } = await supabaseAdmin
            .from('auth_codes')
            .select('*')
            .eq('code', code)
            .eq('status', 'pending')
            .single();

        if (!authCode) return NextResponse.json({ error: 'Code not found' }, { status: 404 });

        // 3. Создаем/ищем юзера (логика как в вебхуке)
        // ... (код поиска пользователя по maxUserId) ...
        // Допустим, мы нашли userId
        const userId = "...";

        // 4. Генерируем ссылку для Chrome
        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: `max_${maxUserId}@smashclub.pwa`,
        });

        // 5. Подтверждаем код
        await supabaseAdmin
            .from('auth_codes')
            .update({
                status: 'verified',
                user_id: userId,
                provider_data: { action_link: linkData.properties?.action_link }
            })
            .eq('code', code);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}