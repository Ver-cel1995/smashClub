'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { createAdminClient } from '@/shared/lib/supabase/admin'
import type { ActionResult } from '@/shared/lib/actions/types'
import { parseTournamentPdf, type ParsedTournament } from '@/shared/lib/ai/parse-tournament-pdf'

/**
 * Загружает PDF в Supabase Storage.
 * Возвращает { url, path } для сохранения в БД.
 */
export async function uploadTournamentPdf(
    formData: FormData
): Promise<ActionResult<{ url: string; path: string }>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    // Проверка что тренер
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'coach') {
        return { success: false, error: 'Только тренер может загружать положения' }
    }

    const file = formData.get('pdf') as File | null
    if (!file || file.size === 0) {
        return { success: false, error: 'Файл не выбран' }
    }

    if (file.type !== 'application/pdf') {
        return { success: false, error: 'Нужен PDF-файл' }
    }

    if (file.size > 10 * 1024 * 1024) {
        return { success: false, error: 'Файл больше 10 МБ' }
    }

    // Уникальное имя: {userId}/{timestamp}-{safe-name}.pdf
    const timestamp = Date.now()
    const safeName = file.name
        .replace(/[^a-zA-Z0-9а-яА-Я._-]/g, '_')
        .slice(0, 100)
    const path = `${user.id}/${timestamp}-${safeName}`

    const { error: uploadError } = await supabase.storage
        .from('tournament-pdfs')
        .upload(path, file, {
            contentType: 'application/pdf',
            upsert: false,
        })

    if (uploadError) {
        console.error('PDF upload failed:', uploadError)
        return { success: false, error: 'Не удалось загрузить файл' }
    }

    const { data: { publicUrl } } = supabase.storage
        .from('tournament-pdfs')
        .getPublicUrl(path)

    return {
        success: true,
        data: { url: publicUrl, path },
    }
}

/**
 * Парсит уже загруженный PDF через OpenAI.
 * Принимает storage-путь, читает файл через admin client (обход RLS для скачивания),
 * отправляет в OpenAI, возвращает структурированные данные.
 */
export async function parseTournamentPdfAction(
    storagePath: string
): Promise<ActionResult<ParsedTournament>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    // Проверка прав
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'coach') {
        return { success: false, error: 'Только тренер может парсить положения' }
    }

    try {
        let parsed: ParsedTournament

        // В DEV-режиме идём через прокси на Vercel (Gemini блокирует РФ IP).
        // В PROD-режиме вызываем Gemini напрямую с Vercel-серверов (США).
        const useProxy = process.env.NODE_ENV === 'development' && process.env.AI_PROXY_URL

        if (useProxy) {
            const proxyResp = await fetch(
                `${process.env.AI_PROXY_URL}/api/ai/parse-tournament-pdf`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Proxy-Secret': process.env.AI_PROXY_SECRET!,
                        // Пробрасываем cookies для авторизации Supabase на проксе
                        'Cookie': (await import('next/headers')).cookies().toString(),
                    },
                    body: JSON.stringify({ storagePath }),
                }
            )

            if (!proxyResp.ok) {
                const errText = await proxyResp.text().catch(() => 'proxy failed')
                throw new Error(`Proxy ${proxyResp.status}: ${errText}`)
            }

            const proxyData = await proxyResp.json()
            if (!proxyData.success) {
                throw new Error(proxyData.error || 'Proxy returned error')
            }
            parsed = proxyData.data as ParsedTournament
        } else {
            // Прямой вызов Gemini (production на Vercel)
            const { data: fileData, error: downloadError } = await supabase.storage
                .from('tournament-pdfs')
                .download(storagePath)

            if (downloadError || !fileData) {
                console.error('PDF download failed:', downloadError)
                return { success: false, error: 'Не удалось прочитать файл' }
            }

            const buffer = await fileData.arrayBuffer()
            parsed = await parseTournamentPdf(new Uint8Array(buffer))
        }

        return { success: true, data: parsed }
    } catch (err) {
        console.error('AI parsing failed:', err)

        const message = err instanceof Error ? err.message : ''
        const lower = message.toLowerCase()

        if (lower.includes('404') || lower.includes('not_found') || lower.includes('no longer available')) {
            return { success: false, error: 'Модель AI недоступна. Обратись к разработчику для обновления.' }
        }
        if (lower.includes('401') || lower.includes('403') || lower.includes('api key') || lower.includes('permission_denied')) {
            return { success: false, error: 'Ошибка доступа к AI. Обратись к разработчику.' }
        }
        if (lower.includes('429') || lower.includes('rate_limit') || lower.includes('quota') || lower.includes('resource_exhausted')) {
            return { success: false, error: 'Слишком много запросов к AI. Попробуй через минуту.' }
        }
        if (lower.includes('user location is not supported')) {
            return { success: false, error: 'AI недоступен из твоего региона. Проверь настройки прокси.' }
        }
        if (lower.includes('400') || lower.includes('invalid_argument')) {
            return { success: false, error: 'Не удалось прочитать PDF. Попробуй другой файл.' }
        }

        return { success: false, error: 'Не удалось автоматически распознать положение. Заполни поля вручную.' }
    }
}

/**
 * Удаляет загруженный PDF из storage (если парсинг не пошёл и юзер отменил).
 */
export async function deleteTournamentPdf(storagePath: string): Promise<ActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Нужно войти' }
    }

    const { error } = await supabase.storage
        .from('tournament-pdfs')
        .remove([storagePath])

    if (error) {
        console.error('PDF delete failed:', error)
        return { success: false, error: 'Не удалось удалить файл' }
    }

    return { success: true }
}




import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Database } from '@/types/database'

// Валидация формы турнира на сервере
const createTournamentSchema = z.object({
    title: z.string().min(3, 'Название минимум 3 символа').max(200),
    tournament_type: z.enum(['home', 'away']),
    organizer: z.string().max(200).nullable(),
    city: z.string().min(2, 'Укажи город').max(100),
    venue_name: z.string().max(200).nullable(),
    venue_address: z.string().max(300).nullable(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Неверный формат даты'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    registration_time: z.string().max(50).nullable(),
    start_time: z.string().max(50).nullable(),
    awards_time: z.string().max(50).nullable(),
    registration_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    entry_fee: z.number().int().min(0).max(1000000).nullable(),
    entry_fee_note: z.string().max(500).nullable(),
    description: z.string().max(2000).nullable(),
    contact_info: z.string().max(300).nullable(),
    pdf_url: z.string().url().nullable(),
    pdf_storage_path: z.string().nullable(),
    categories: z.array(z.object({
        category: z.enum(['MS', 'WS', 'MD', 'WD', 'XD']),
        age_group: z.string().nullable(),
    })).min(1, 'Добавь хотя бы одну категорию'),
})

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>

function extractFieldErrors(error: unknown): Record<string, string> {
    if (typeof error === 'object' && error !== null && 'issues' in error &&
        Array.isArray((error as { issues: unknown }).issues)) {
        const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues
        return issues.reduce((acc, issue) => {
            const field = issue.path[0]?.toString() || '_'
            if (!acc[field]) acc[field] = issue.message
            return acc
        }, {} as Record<string, string>)
    }
    return {}
}

export async function createTournament(
    input: CreateTournamentInput
): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'coach') {
        return { success: false, error: 'Только тренер может создавать турниры' }
    }

    const parsed = createTournamentSchema.safeParse(input)
    if (!parsed.success) {
        return {
            success: false,
            error: 'Проверь введённые данные',
            fieldErrors: extractFieldErrors(parsed.error),
        }
    }

    const data = parsed.data

    // Собираем location для БД (текущая схема требует одно поле)
    const location = [data.city, data.venue_name, data.venue_address]
        .filter(Boolean)
        .join(', ')

    // Собираем расширенное description (пока БД не разбита на поля времени и т.п.)
    const extendedDescription = [
        data.description,
        data.organizer && `Организатор: ${data.organizer}`,
        data.registration_time && `Регистрация: ${data.registration_time}`,
        data.start_time && `Начало: ${data.start_time}`,
        data.awards_time && `Награждение: ${data.awards_time}`,
        data.entry_fee_note && `Взнос: ${data.entry_fee_note}`,
        data.contact_info && `Контакты: ${data.contact_info}`,
    ].filter(Boolean).join('\n\n')

    // 1. Создаём турнир
    const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
            title: data.title,
            tournament_type: data.tournament_type,
            status: 'draft',
            location,
            venue: data.venue_name,
            start_date: data.start_date,
            end_date: data.end_date,
            description: extendedDescription || null,
            registration_deadline: data.registration_deadline
                ? new Date(data.registration_deadline).toISOString()
                : null,
            has_entry_fee: data.entry_fee !== null && data.entry_fee > 0,
            entry_fee_amount: data.entry_fee,
            pdf_url: data.pdf_url,
            pdf_storage_path: data.pdf_storage_path,
            created_by: user.id,
        })
        .select('id')
        .single()

    if (tournamentError || !tournament) {
        console.error('Failed to create tournament:', tournamentError)
        return { success: false, error: 'Не удалось создать турнир' }
    }

    // 2. Создаём категории
    const categoriesInsert = data.categories.map((c) => ({
        tournament_id: tournament.id,
        category: c.category as Database['public']['Enums']['badminton_category'],
        // age_group пока не в схеме tournament_categories — хранить будем в notes или отдельно потом
        max_pairs: null,
        bracket_format: null,
        bracket_generated: false,
        participants_count: 0,
    }))

    const { error: categoriesError } = await supabase
        .from('tournament_categories')
        .insert(categoriesInsert)

    if (categoriesError) {
        console.error('Failed to create categories:', categoriesError)
        // Откатываем турнир
        await supabase.from('tournaments').delete().eq('id', tournament.id)
        return { success: false, error: 'Не удалось создать категории' }
    }

    revalidatePath('/tournaments')
    revalidatePath('/home')

    return { success: true, data: { id: tournament.id } }
}