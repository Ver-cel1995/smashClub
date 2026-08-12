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
    // — Идентификация —
    title: z.string(),
    organizer: z.string().nullable(),

    // — Место —
    city: z.string(),
    venue_name: z.string().nullable(),
    venue_address: z.string().nullable(),

    // — Даты —
    start_date: z.string(),
    end_date: z.string().nullable(),

    // — Расписание дня —
    registration_time: z.string().nullable(),
    start_time: z.string().nullable(),
    awards_time: z.string().nullable(),

    // — Регистрация —
    registration_deadline: z.string().nullable(),

    // — Финансы —
    entry_fee: z.number().nullable(),
    entry_fee_note: z.string().nullable(),

    // — Категории —
    categories: z.array(ParsedCategorySchema),

    // — Описание и контакты —
    description: z.string().nullable(),
    contact_info: z.string().nullable(),
})

export type ParsedTournament = z.infer<typeof ParsedTournamentSchema>
export type ParsedCategory = z.infer<typeof ParsedCategorySchema>

const geminiResponseSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: 'Полное название турнира из заголовка документа. Без города и дат.',
        },
        organizer: {
            type: Type.STRING,
            nullable: true,
            description: 'Кто организует: "администрация Каневского района", "Федерация бадминтона Краснодарского края"',
        },
        city: {
            type: Type.STRING,
            description: 'ТОЛЬКО населённый пункт: "Кореновск", "ст. Голубицкая", "г. Краснодар". БЕЗ адреса, названия зала и региона.',
        },
        venue_name: {
            type: Type.STRING,
            nullable: true,
            description: 'ТОЛЬКО название зала/спортобъекта: "СК Юность", "ДЮСШ №1", "МАУ Спорт". БЕЗ адреса.',
        },
        venue_address: {
            type: Type.STRING,
            nullable: true,
            description: 'ТОЛЬКО улица и дом: "ул. Мира, 70". БЕЗ города и названия зала.',
        },
        start_date: {
            type: Type.STRING,
            description: 'Дата начала соревнований в формате YYYY-MM-DD.',
        },
        end_date: {
            type: Type.STRING,
            nullable: true,
            description: 'Дата окончания YYYY-MM-DD. null если однодневный турнир.',
        },
        registration_time: {
            type: Type.STRING,
            nullable: true,
            description: 'Время работы мандатной комиссии / регистрации участников: "09:00-10:00", "с 08:30". null если нет.',
        },
        start_time: {
            type: Type.STRING,
            nullable: true,
            description: 'Время начала соревнований / первых игр: "10:30", "11:00". null если нет.',
        },
        awards_time: {
            type: Type.STRING,
            nullable: true,
            description: 'Время награждения / закрытия: "15:00", "по окончании игр". null если нет.',
        },
        registration_deadline: {
            type: Type.STRING,
            nullable: true,
            description: 'Дедлайн предварительной подачи заявки в формате YYYY-MM-DD. null если не указан.',
        },
        entry_fee: {
            type: Type.NUMBER,
            nullable: true,
            description: 'Взнос за участие в рублях (одно число). null если бесплатно или сложная тарификация.',
        },
        entry_fee_note: {
            type: Type.STRING,
            nullable: true,
            description: 'Пояснение к взносу если сложная тарификация: "500₽ одиночка, 800₽ пара". null если простой взнос.',
        },
        categories: {
            type: Type.ARRAY,
            description: 'ВСЕ комбинации категория+возраст из положения. Если 3 возрастные группы × 5 категорий = 15 записей.',
            items: {
                type: Type.OBJECT,
                properties: {
                    category: {
                        type: Type.STRING,
                        enum: ['MS', 'WS', 'MD', 'WD', 'XD'],
                        description: 'MS=м.одиночка, WS=ж.одиночка, MD=м.пара, WD=ж.пара, XD=смешанная пара',
                    },
                    age_group: {
                        type: Type.STRING,
                        nullable: true,
                        description: 'Возрастная группа как в документе: "до 11 лет", "2016-2018 г.р.", "взрослые", "40+"',
                    },
                },
                required: ['category', 'age_group'],
                propertyOrdering: ['category', 'age_group'],
            },
        },
        description: {
            type: Type.STRING,
            nullable: true,
            description: 'Краткое описание (1-3 предложения): условия допуска, требования к участникам, ключевые моменты. БЕЗ дублирования дат/места/взноса.',
        },
        contact_info: {
            type: Type.STRING,
            nullable: true,
            description: 'Контактное лицо и телефон: "Иванов И.И., +7 999 123-45-67". null если нет.',
        },
    },
    required: [
        'title', 'organizer',
        'city', 'venue_name', 'venue_address',
        'start_date', 'end_date',
        'registration_time', 'start_time', 'awards_time',
        'registration_deadline',
        'entry_fee', 'entry_fee_note',
        'categories',
        'description', 'contact_info',
    ],
    propertyOrdering: [
        'title', 'organizer',
        'city', 'venue_name', 'venue_address',
        'start_date', 'end_date',
        'registration_time', 'start_time', 'awards_time',
        'registration_deadline',
        'entry_fee', 'entry_fee_note',
        'categories',
        'description', 'contact_info',
    ],
}

/**
 * Парсит PDF-положение турнира через Google Gemini.
 */
export async function parseTournamentPdf(
    pdfBytes: Uint8Array,
    hintYear?: number
): Promise<ParsedTournament> {
    const base64 = Buffer.from(pdfBytes).toString('base64')
    const currentYear = hintYear ?? new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    const prompt = `Ты — помощник тренера бадминтонной школы. Извлеки структурированные данные из официального положения о соревнованиях по бадминтону в России.

ВАЖНЫЕ ПРАВИЛА:

Даты:
- Формат строго YYYY-MM-DD.
- Если в документе указан только день и месяц без года — используй ${currentYear}.
- Если дата явно в прошлом (например, месяц уже прошёл, а сейчас ${currentMonth}) — прибавь 1 год.

Место — РАЗДЕЛЯЙ, НЕ ДУБЛИРУЙ:
- city: ТОЛЬКО населённый пункт ("Кореновск", "ст. Голубицкая"). НЕ включай сюда название зала или адрес.
- venue_name: ТОЛЬКО название спортобъекта ("СК Юность", "ДЮСШ"). НЕ повторяй город.
- venue_address: ТОЛЬКО улица и дом ("ул. Мира, 70"). НЕ повторяй город и название зала.
- Если полный адрес был "СК Юность, Каневской район, ст. Стародеревянковская, ул. Мира, 70" → city="ст. Стародеревянковская", venue_name="СК Юность", venue_address="ул. Мира, 70".

Время:
- Строковый формат, как в документе: "09:00", "09:00-10:00", "с 10:30", "по окончании игр".
- registration_time — работа мандатной комиссии, приём заявок в день турнира.
- start_time — начало игр.
- awards_time — награждение/закрытие.

Категории:
- Строго из набора: MS (мужская одиночка), WS (женская одиночка), MD (мужская пара), WD (женская пара), XD (смешанная пара).
- Если в положении несколько возрастных групп × несколько категорий — верни ВСЕ комбинации отдельными записями.
- Пример: если "мальчики до 11 лет — одиночка, парный" и "мальчики до 13 лет — одиночка, парный" → 4 записи: MS/до 11, MD/до 11, MS/до 13, MD/до 13.
- age_group копируй как написано ("до 11 лет", "2016-2018 г.р."), не переформатируй.

Взнос:
- entry_fee: одно число рублей если взнос простой ("500 руб.") → 500.
- entry_fee_note: используй только если сложная тарификация ("500₽ одиночка, 800₽ пара"). Если простой взнос — null.

Описание:
- 1-3 предложения о ключевом: организатор, условия допуска, спецтребования.
- НЕ дублируй информацию, которая уже есть в других полях (даты, место, взнос).

Общее:
- Если поля НЕТ в документе — ставь null. НЕ ВЫДУМЫВАЙ.
- Название турнира бери из заголовка, не из URL/footer/подписи.

Текущий год: ${currentYear}. Текущий месяц: ${currentMonth}.

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