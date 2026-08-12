/**
 * Централизованный маппер ошибок PostgreSQL / Supabase.
 * Превращает cryptic postgres codes в понятные пользователю сообщения.
 *
 * Использование:
 *   const { error } = await supabase.from('...').insert(...)
 *   if (error) {
 *     return { success: false, error: mapPgError(error, 'создать запись') }
 *   }
 */

export type PgErrorLike = {
    code?: string
    message?: string
    details?: string | null
    hint?: string | null
}

const PG_CODE_MAP: Record<string, string> = {
    // RLS violation
    '42501': 'Недостаточно прав для этого действия',
    // Unique violation (duplicate key)
    '23505': 'Такая запись уже существует',
    // Foreign key violation (нет связанной записи)
    '23503': 'Связанная запись не найдена или используется',
    // Not null violation
    '23502': 'Не заполнено обязательное поле',
    // Check violation
    '23514': 'Данные не прошли проверку',
    // Deadlock
    '40P01': 'Конфликт при одновременных изменениях. Попробуй ещё раз.',
    // Serialization failure
    '40001': 'Данные изменились одновременно. Попробуй ещё раз.',
    // Query cancelled (timeout)
    '57014': 'Запрос слишком долго выполнялся',
    // Insufficient resources
    '53100': 'База данных перегружена, попробуй позже',
    // Not found (custom raise)
    'PGRST116': 'Запись не найдена',
}

/**
 * Основной маппер.
 * @param error - объект ошибки от Supabase
 * @param actionContext - что пытались сделать, например "создать турнир"
 */
export function mapPgError(error: PgErrorLike | null | undefined, actionContext: string): string {
    if (!error) return `Не удалось ${actionContext}`

    const code = error.code
    if (code && PG_CODE_MAP[code]) {
        return PG_CODE_MAP[code]
    }

    // Fallback: показывает контекст без details (в details бывают технические подробности)
    return `Не удалось ${actionContext}`
}

/**
 * Проверка: это ошибка «нет прав» (RLS)?
 */
export function isPermissionError(error: PgErrorLike | null | undefined): boolean {
    return error?.code === '42501'
}

/**
 * Проверка: это ошибка «уже существует» (unique)?
 */
export function isUniqueViolation(error: PgErrorLike | null | undefined): boolean {
    return error?.code === '23505'
}

/**
 * Проверка: это ошибка «не найдено»?
 */
export function isNotFoundError(error: PgErrorLike | null | undefined): boolean {
    return error?.code === 'PGRST116'
}