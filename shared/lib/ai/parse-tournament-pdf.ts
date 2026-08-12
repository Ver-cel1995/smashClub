import { z } from 'zod'
import { openai, OPENAI_MODEL } from './openai'
import { zodResponseFormat } from 'openai/helpers/zod'

/**
 * Категории бадминтона в наших enum:
 * MS = мужская одиночка, WS = женская одиночка,
 * MD = мужская пара, WD = женская пара, XD = смешанная пара.
 */
export const ParsedCategorySchema = z.object({
    category: z.enum(['MS', 'WS', 'MD', 'WD', 'XD'])
        .describe('Тип категории: MS=мужская одиночка, WS=женская одиночка, MD=мужская пара, WD=женская пара, XD=смешанная пара'),
    age_group: z.string().nullable()
        .describe('Возрастная группа как в документе, например "до 11 лет", "2016-2018 г.р.", "взрослые". null если не указано'),
})

export const ParsedTournamentSchema = z.object({
    title: z.string()
        .describe('Название турнира. Пример: "Краевые соревнования по бадминтону", "Открытый кубок Кущёвской"'),
    location: z.string()
        .describe('Город/населённый пункт проведения. Пример: "Кореновск", "Краснодар"'),
    venue: z.string().nullable()
        .describe('Точный адрес зала/спортшколы/место проведения если указан. null если не указан'),
    start_date: z.string()
        .describe('Дата начала соревнований в формате YYYY-MM-DD. Год бери из контекста документа (обычно текущий или ближайший будущий).'),
    end_date: z.string().nullable()
        .describe('Дата окончания в формате YYYY-MM-DD. null если однодневный турнир.'),
    registration_deadline: z.string().nullable()
        .describe('Дедлайн регистрации в формате YYYY-MM-DD. null если не указан.'),
    entry_fee: z.number().nullable()
        .describe('Взнос за участие в рублях (только число). null если не указано или бесплатно.'),
    categories: z.array(ParsedCategorySchema)
        .describe('Массив всех категорий/разрядов из положения. Один разряд = одна категория.'),
    description: z.string().nullable()
        .describe('Краткое описание (2-3 предложения) - организатор, условия допуска, ключевые моменты. null если ничего важного нет.'),
})

export type ParsedTournament = z.infer<typeof ParsedTournamentSchema>

/**
 * Парсит PDF-положение турнира через OpenAI и возвращает структурированные данные.
 *
 * @param pdfBuffer - содержимое PDF как ArrayBuffer или Buffer
 * @param hintYear - опциональная подсказка про год (если в PDF только "4-5 сентября" без года)
 */
export async function parseTournamentPdf(
    pdfBuffer: ArrayBuffer | Buffer,
    hintYear?: number
): Promise<ParsedTournament> {
    const base64 = Buffer.from(new Uint8Array(pdfBuffer as ArrayBuffer)).toString('base64')
    const currentYear = hintYear ?? new Date().getFullYear()

    const systemPrompt = `Ты — помощник тренера бадминтонной школы. Твоя задача — извлечь структурированные данные из официального положения о соревнованиях по бадминтону в России.

Правила:
- Даты всегда в формате YYYY-MM-DD.
- Если в документе указан только день и месяц без года, используй ${currentYear}. Если дата явно в прошлом относительно сегодня — прибавь 1 год.
- Категории бадминтона строго из набора: MS (мужская одиночка), WS (женская одиночка), MD (мужская пара), WD (женская пара), XD (смешанная пара).
- Возрастная группа копируется как написано ("до 11 лет", "2016-2018 г.р.", "взрослые"), не переформатируй.
- Взнос — только число рублей, без символов и слов.
- Если чего-то нет в документе — ставь null, не выдумывай.
- Название турнира бери из заголовка документа, а не из URL или подписи.`

    const response = await openai.chat.completions.parse({
        model: OPENAI_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `Извлеки данные из этого положения о соревнованиях. Текущий год ${currentYear}.`,
                    },
                    {
                        type: 'file',
                        file: {
                            filename: 'tournament.pdf',
                            file_data: `data:application/pdf;base64,${base64}`,
                        },
                    },
                ],
            },
        ],
        response_format: zodResponseFormat(ParsedTournamentSchema, 'tournament'),
        temperature: 0,  // максимально детерминированно, никакой креативности
    })

    const parsed = response.choices[0]?.message.parsed
    if (!parsed) {
        throw new Error('OpenAI не вернул структурированный ответ')
    }

    return parsed
}