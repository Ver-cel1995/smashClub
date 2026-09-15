import { createClient } from '@/shared/lib/supabase/server'

export type RateLimitConfig = {
    action: string
    maxAttempts: number
    windowMs: number
    errorMessage?: string
}

export type RateLimitResult =
    | { allowed: true }
    | { allowed: false; error: string; retryAfterSeconds: number }

export async function checkRateLimit(
    userId: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const supabase = await createClient()
    const cutoff = new Date(Date.now() - config.windowMs).toISOString()

    // Считаем количество попыток за окно
    const { count, error } = await supabase
        .from('rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action', config.action)
        .gte('created_at', cutoff)

    if (error) {
        // Если проверка упала (например, нет RLS или юзера) — НЕ блокируем юзера
        console.error('[rate-limit] check failed:', error)
        return { allowed: true }
    }

    if (count !== null && count >= config.maxAttempts) {
        const { data: oldestEntry } = await supabase
            .from('rate_limits')
            .select('created_at')
            .eq('user_id', userId)
            .eq('action', config.action)
            .gte('created_at', cutoff)
            .order('created_at', { ascending: true })
            .limit(1)
            .single()

        let retryAfterSeconds = Math.ceil(config.windowMs / 1000)
        if (oldestEntry) {
            const oldestTime = new Date(oldestEntry.created_at).getTime()
            const retryAt = oldestTime + config.windowMs
            retryAfterSeconds = Math.max(1, Math.ceil((retryAt - Date.now()) / 1000))
        }

        return {
            allowed: false,
            error:
                config.errorMessage ??
                `Слишком много попыток. Подожди ${formatDuration(retryAfterSeconds)}.`,
            retryAfterSeconds,
        }
    }

    // Логируем попытку
    await supabase.from('rate_limits').insert({
        user_id: userId,
        action: config.action,
    })

    return { allowed: true }
}

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds} сек`
    if (seconds < 3600) {
        const m = Math.ceil(seconds / 60)
        return `${m} мин`
    }
    const h = Math.ceil(seconds / 3600)
    return `${h} ч`
}

// ============================================================
// Готовые конфиги для наших actions
// ============================================================

export const RATE_LIMITS = {
    CREATE_TOURNAMENT: {
        action: 'create_tournament',
        maxAttempts: 10,
        windowMs: 60 * 60 * 1000,
        errorMessage: 'Слишком много турниров создано за час. Подожди.',
    },
    PARSE_PDF: {
        action: 'parse_pdf',
        maxAttempts: 20,
        windowMs: 60 * 60 * 1000,
        errorMessage: 'Много PDF-парсингов подряд. Подожди немного.',
    },
    REGISTER_TOURNAMENT: {
        action: 'register_tournament',
        maxAttempts: 5,
        windowMs: 60 * 1000,
        errorMessage: 'Не так быстро. Подожди минуту.',
    },
    RESPOND_INVITE: {
        action: 'respond_invite',
        maxAttempts: 3,
        windowMs: 60 * 1000,
        errorMessage: 'Слишком часто. Подожди минуту.',
    },
    CREATE_GUEST: {
        action: 'create_guest',
        maxAttempts: 10,
        windowMs: 24 * 60 * 60 * 1000,
        errorMessage: 'Достигнут лимит новых гостей в сутки.',
    },
    // Сброс пароля: максимум 3 попытки за 5 минут
    PASSWORD_RESET: {
        action: 'password_reset',
        maxAttempts: 3,
        windowMs: 5 * 60 * 1000,
        errorMessage: 'Слишком много запросов. Подождите 5 минут.',
    },
} as const