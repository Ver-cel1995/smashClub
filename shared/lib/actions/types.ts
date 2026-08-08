/**
 * Стандартный формат результата Server Action.
 * Используем во всех actions для единообразия.
 */
export type ActionResult<T = void> =
    | { success: true; data?: T }
    | {
    success: false
    error: string
    // Field-level ошибки для формы: { email: 'invalid', password: 'too short' }
    fieldErrors?: Record<string, string>
}