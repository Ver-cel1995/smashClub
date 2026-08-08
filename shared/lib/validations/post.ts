import { z } from 'zod'

const toTrimmedString = z.unknown().transform((val) => {
    if (typeof val !== 'string') return ''
    return val.trim()
})

const toRawString = z.unknown().transform((val) => {
    if (typeof val !== 'string') return ''
    return val
})

const toBoolean = z.unknown().transform((val) => {
    return val === 'on' || val === 'true' || val === true
})

const titleSchema = toTrimmedString.pipe(
    z.string().max(200, 'Заголовок слишком длинный').or(z.literal(''))
)

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

// Опрос
const pollOptionSchema = z.object({
    id: z.string(),
    text: z.string().min(1, 'Вариант не может быть пустым').max(200, 'Слишком длинный вариант'),
    votes: z.number().default(0),
})

export const createPollSchema = z.object({
    title: titleSchema,
    content: toRawString.pipe(
        z.string().max(5000, 'Текст слишком длинный').or(z.literal('')) // optional error
    ),
    poll_question: toTrimmedString.pipe(
        z.string().min(1, 'Введи вопрос опроса').max(500, 'Вопрос слишком длинный')
    ),
    poll_options: z
        .array(pollOptionSchema)
        .min(2, 'Минимум 2 варианта')
        .max(10, 'Максимум 10 вариантов'),
    poll_multiple_choice: toBoolean,
    is_pinned: toBoolean,
})

export type CreatePollInput = z.infer<typeof createPollSchema>