import { z } from 'zod'

// Переиспользуем препроцессоры
const toTrimmedString = z.unknown().transform((val) => {
    if (typeof val !== 'string') return ''
    return val.trim()
})

const toRawString = z.unknown().transform((val) => {
    if (typeof val !== 'string') return ''
    return val
})

const toBoolean = z.unknown().transform((val) => {
    // FormData передаёт чекбоксы как 'on' или отсутствует вообще
    return val === 'on' || val === 'true' || val === true
})

// Заголовок — опциональный
const titleSchema = toTrimmedString.pipe(
    z.string()
        .max(200, 'Заголовок слишком длинный')
        // .optional()
        .or(z.literal(''))
)

// Содержимое — обязательное
const contentSchema = toRawString.pipe(
    z
        .string()
        .min(1, 'Напиши что-нибудь')
        .max(5000, 'Пост слишком длинный (максимум 5000 символов)')
)

export const createPostSchema = z.object({
    title: titleSchema,
    content: contentSchema,
    is_pinned: toBoolean,
})

export type CreatePostInput = z.infer<typeof createPostSchema>