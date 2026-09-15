// src/app/(auth)/password-actions.ts
'use server';

import { createClient } from '@/shared/lib/supabase/server';
import { ActionResult } from '@/shared/lib/actions/types';
import { checkRateLimit, RATE_LIMITS } from '@/shared/lib/rate-limit';

/**
 * 1. Запрос ссылки на сброс пароля
 */
export async function requestPasswordReset(
    formData: FormData
): Promise<ActionResult<{ email: string }>> {
    try {
        const email = formData.get('email')?.toString().trim().toLowerCase();

        if (!email || !email.includes('@')) {
            return { success: false, error: 'Укажите корректный адрес электронной почты' };
        }

        const ANON_SYSTEM_UUID = '00000000-0000-0000-0000-000000000000';
        const rateLimit = await checkRateLimit(ANON_SYSTEM_UUID, RATE_LIMITS.PASSWORD_RESET);
        if (!rateLimit.allowed) {
            return { success: false, error: rateLimit.error };
        }

        const supabase = await createClient();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // ВАЖНО: redirectTo ведет на /auth/callback, который установит сессию и перекинет на /reset-password
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
        });

        if (error) {
            console.error('[Password Reset Error]:', error);
            return {
                success: false,
                error: error.message || 'Не удалось отправить инструкцию',
            };
        }

        return { success: true, data: { email } };
    } catch (err: any) {
        console.error('[Password Reset Exception]:', err);
        return { success: false, error: err?.message || 'Внутренняя ошибка сервера' };
    }
}

/**
 * 2. Установка нового пароля
 */
export async function updatePassword(
    formData: FormData
): Promise<ActionResult<void>> {
    try {
        const password = formData.get('password')?.toString();
        const confirmPassword = formData.get('confirmPassword')?.toString();

        if (!password || password.length < 6) {
            return { success: false, error: 'Пароль должен содержать не менее 6 символов' };
        }

        if (password !== confirmPassword) {
            return { success: false, error: 'Пароли не совпадают' };
        }

        const supabase = await createClient();
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            console.error('[Update Password Error]:', error);
            return { success: false, error: error.message || 'Не удалось обновить пароль' };
        }

        return { success: true, data: undefined };
    } catch (err: any) {
        console.error('[Update Password Exception]:', err);
        return { success: false, error: 'Внутренняя ошибка сервера' };
    }
}