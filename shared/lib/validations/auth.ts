import { z } from 'zod'

/**
 * Нормализует любое значение из FormData в строку.
 * FormData.get() может вернуть null, File или string.
 * Пустые/нестроковые значения → ''.
 * Строки триммятся.
 */
const toTrimmedString = z.unknown().transform((val) => {
    if (typeof val !== 'string') return ''
    return val.trim()
})

/**
 * То же самое, но без .trim() — для паролей.
 * Пробел может быть частью пароля.
 */
const toRawString = z.unknown().transform((val) => {
    if (typeof val !== 'string') return ''
    return val
})

// ============================================
// EMAIL
// ============================================
const emailSchema = toTrimmedString.pipe(
    z
        .string()
        .min(1, 'Введи email')
        .email('Введи корректный email')
        .transform((v) => v.toLowerCase())
)

// ============================================
// ПАРОЛЬ (при регистрации)
// ============================================
const passwordSchema = toRawString.pipe(
    z
        .string()
        .min(1, 'Введи пароль')
        .min(8, 'Пароль должен быть минимум 8 символов')
        .max(72, 'Пароль слишком длинный')
)

// ============================================
// ПАРОЛЬ (при входе — не проверяем длину)
// ============================================
const signInPasswordSchema = toRawString.pipe(
    z.string().min(1, 'Введи пароль')
)

// ============================================
// ПОДТВЕРЖДЕНИЕ ПАРОЛЯ
// ============================================
const confirmPasswordSchema = toRawString.pipe(
    z.string().min(1, 'Повтори пароль')
)

// ============================================
// ИМЯ
// ============================================
const nameSchema = toTrimmedString.pipe(
    z
        .string()
        .min(1, 'Введи имя и фамилию')
        .min(2, 'Имя слишком короткое')
        .max(100, 'Имя слишком длинное')
)

// ============================================
// СХЕМЫ ФОРМ
// ============================================
export const signInSchema = z.object({
    email: emailSchema,
    password: signInPasswordSchema,
})

export const signUpSchema = z
    .object({
        name: nameSchema,
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: confirmPasswordSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    })

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>