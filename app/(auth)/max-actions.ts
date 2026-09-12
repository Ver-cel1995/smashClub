'use server';

import { createAdminClient } from '@/shared/lib/supabase/admin';

export interface CreateMaxAuthCodeResult {
    success: boolean;
    code?: string;
    deepLink?: string;
    error?: string;
}

export interface CheckMaxAuthStatusResult {
    status: 'pending' | 'verified' | 'expired' | 'not_found';
    actionLink?: string;
}

const BOT_USERNAME = 'se14302662_bot';

// Генерирует 6-значный код авторизации и запись в auth_codes

export async function createMaxAuthCode(): Promise<CreateMaxAuthCodeResult> {
    try {
        const supabaseAdmin = createAdminClient();

        // Генерируем 6-значный случайный код
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Срок действия — 5 минут
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        const { error } = await supabaseAdmin.from('auth_codes').insert({
            code,
            provider: 'max',
            status: 'pending',
            expires_at: expiresAt,
        });

        if (error) {
            console.error('[MAX Auth] Ошибка создания кода:', error);
            return { success: false, error: 'Не удалось сгенерировать код авторизации' };
        }

        // Формируем Deep Link для запуска бота с кодом
        const deepLink = `https://max.ru/${BOT_USERNAME}?start=${code}`;

        return {
            success: true,
            code,
            deepLink,
        };
    } catch (err: any) {
        console.error('[MAX Auth] Exception createMaxAuthCode:', err);
        return { success: false, error: 'Внутренняя ошибка сервера' };
    }
}

// Проверяет статус кода (клиент вызывает через поллинг каждые 2 сек)

export async function checkMaxAuthCodeStatus(code: string): Promise<CheckMaxAuthStatusResult> {
    try {
        const supabaseAdmin = createAdminClient();

        const { data, error } = await supabaseAdmin
            .from('auth_codes')
            .select('status, provider_data, expires_at')
            .eq('code', code)
            .eq('provider', 'max')
            .maybeSingle();

        if (error || !data) {
            return { status: 'not_found' };
        }

        // Проверка просрочки
        if (new Date(data.expires_at) < new Date() && data.status === 'pending') {
            await supabaseAdmin
                .from('auth_codes')
                .update({ status: 'expired' })
                .eq('code', code);
            return { status: 'expired' };
        }

        if (data.status === 'verified') {
            const providerData = data.provider_data as { action_link?: string } | null;
            return {
                status: 'verified',
                actionLink: providerData?.action_link,
            };
        }

        return { status: data.status as 'pending' | 'expired' };
    } catch (err) {
        console.error('[MAX Auth] Exception checkMaxAuthCodeStatus:', err);
        return { status: 'not_found' };
    }
}

// для тестирования на localhost

export async function loginWithDevMax(code: string) {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dev/sim-max?code=${code}`,
            { method: 'GET', cache: 'no-store' }
        );
        return await res.json();
    } catch (err) {
        return { success: false, error: 'Не удалось связаться с симулятором MAX' };
    }
}