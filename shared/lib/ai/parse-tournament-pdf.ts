import { z } from 'zod'
import { Type } from '@google/genai'
import { gemini, GEMINI_MODEL } from './gemini'

/**
 * Категории бадминтона:
 * MS = мужская одиночка, WS = женская одиночка,
 * MD = мужская пара, WD = женская пара, XD = смешанная пара.
 */
export const ParsedCategorySchema = z.object({
    category: z.enum(['MS', 'WS', 'MD', 'WD', 'XD']),
    age_group: z.string().nullable(),
})

export const ParsedTournamentSchema = z.object({
    title: z.string(),
    location: z.string(),
    venue: z.string().nullable(),
    start_date: z.string(),
    end_date: z.string().nullable(),
    registration_deadline: z.string().nullable(),
    entry_fee: z.number().nullable(),
    categories: z.array(ParsedCategorySchema),
    description: z.string().nullable(),
})

export type ParsedTournament = z.infer<typeof ParsedTournamentSchema>

/**
 * Схема ответа для Gemini (нативный формат).
 * После парсинга JSON валидируем через Zod для type safety.
 */
const geminiResponseSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: 'Название турнира из заголовка документа',
        },
        location: {
            type: Type.STRING,
            description: 'Город или населённый пункт проведения',
        },
        venue: {
            type: Type.STRING,
            nullable: true,
            description: 'Точный адрес зала/спортшколы если указан',
        },
        start_date: {
            type: Type.STRING,
            description: 'Дата начала в формате YYYY-MM-DD',
        },
        end_date: {
            type: Type.STRING,
            nullable: true,
            description: 'Дата окончания в формате YYYY-MM-DD. null если однодневный',
        },
        registration_deadline: {
            type: Type.STRING,
            nullable: true,
            description: 'Дедлайн регистрации YYYY-MM-DD. null если не указан',
        },
        entry_fee: {
            type: Type.NUMBER,
            nullable: true,
            description: 'Взнос в рублях (только число). null если бесплатно',
        },
        categories: {
            type: Type.ARRAY,
            description: 'Массив всех категорий/разрядов из положения',
            items: {
                type: Type.OBJECT,
                properties: {
                    category: {
                        type: Type.STRING,
                        enum: ['MS', 'WS', 'MD', 'WD', 'XD'],
                        description: 'MS=м.одиночка, WS=ж.одиночка, MD=м.пара, WD=ж.пара, XD=смеш.пара',
                    },
                    age_group: {
                        type: Type.STRING,
                        nullable: true,
                        description: 'Возрастная группа: "до 11 лет", "2016-2018 г.р.", "взрослые"',
                    },
                },
                required: ['category', 'age_group'],
                propertyOrdering: ['category', 'age_group'],
            },
        },
        description: {
            type: Type.STRING,
            nullable: true,
            description: 'Краткое описание (2-3 предложения) - организатор, условия допуска',
        },
    },
    required: [
        'title',
        'location',
        'venue',
        'start_date',
        'end_date',
        'registration_deadline',
        'entry_fee',
        'categories',
        'description',
    ],
    propertyOrdering: [
        'title',
        'location',
        'venue',
        'start_date',
        'end_date',
        'registration_deadline',
        'entry_fee',
        'categories',
        'description',
    ],
}

/**
 * Парсит PDF-положение турнира через Google Gemini.
 * @param pdfBytes - содержимое PDF как Uint8Array
 * @param hintYear - опциональный текущий год
 */
export async function parseTournamentPdf(
    pdfBytes: Uint8Array,
    hintYear?: number
): Promise<ParsedTournament> {
    const base64 = Buffer.from(pdfBytes).toString('base64')
    const currentYear = hintYear ?? new Date().getFullYear()

    const prompt = `Ты — помощник тренера бадминтонной школы. Извлеки структурированные данные из официального положения о соревнованиях по бадминтону в России.

Правила:
- Даты всегда в формате YYYY-MM-DD.
- Если в документе указан только день и месяц без года, используй ${currentYear}. Если дата явно в прошлом относительно сегодняшнего дня — прибавь 1 год.
- Категории бадминтона строго из набора: MS (мужская одиночка), WS (женская одиночка), MD (мужская пара), WD (женская пара), XD (смешанная пара).
- Возрастная группа копируется как написано ("до 11 лет", "2016-2018 г.р.", "взрослые"), не переформатируй.
- Взнос — только число рублей, без символов и слов.
- Если чего-то нет в документе — ставь null, не выдумывай.
- Название турнира бери из заголовка документа, а не из URL или подписи.
- Текущий год: ${currentYear}.

Извлеки данные из этого положения о соревнованиях.`

    const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: 'application/pdf',
                            data: base64,
                        },
                    },
                    { text: prompt },
                ],
            },
        ],
        config: {
            responseMimeType: 'application/json',
            responseSchema: geminiResponseSchema,
            temperature: 0,
        },
    })

    const text = response.text
    if (!text) {
        throw new Error('Gemini не вернул текст ответа')
    }

    let rawJson: unknown
    try {
        rawJson = JSON.parse(text)
    } catch {
        throw new Error('Gemini вернул невалидный JSON')
    }

    const validated = ParsedTournamentSchema.safeParse(rawJson)
    if (!validated.success) {
        console.error('Zod validation failed:', validated.error)
        throw new Error('Gemini вернул данные в неверном формате')
    }

    return validated.data
}