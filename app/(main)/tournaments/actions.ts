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

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.PARSE_PDF)
    if (!rateLimit.allowed) {
        return { success: false, error: rateLimit.error }
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
import {checkRateLimit, RATE_LIMITS} from "@/shared/lib/rate-limit";
import {mapPgError} from "@/shared/lib/actions/pg-errors";

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
    registration_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    entry_fee: z.number().int().min(0).max(1000000).nullable(),
    entry_fee_note: z.string().max(500).nullable(),
    description: z.string().max(2000).nullable(),
    contact_info: z.string().max(300).nullable(),
    pdf_url: z.string().url().nullable(),
    pdf_storage_path: z.string().nullable(),
    awards: z.string().max(1000).nullable(),   // ← НОВОЕ
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
    input: {
        title: string;
        tournament_type: "home" | "away";
        organizer: string | null;
        city: string;
        venue_name: string | null;
        venue_address: string | null;
        start_date: string;
        end_date: string | null;
        registration_time: string | null;
        start_time: string | null;
        awards: string | null;
        registration_deadline: string | null;
        entry_fee: number | null;
        entry_fee_note: string | null;
        description: string | null;
        contact_info: string | null;
        pdf_url: string | null;
        pdf_storage_path: string | null;
        categories: { category: "MS" | "WS" | "MD" | "WD" | "XD"; age_group: string | null }[]
    }
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

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.CREATE_TOURNAMENT)
    if (!rateLimit.allowed) {
        return { success: false, error: rateLimit.error }
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

    // Собираем расширенное description
    const extendedDescription = [
        data.description,
        data.organizer && `Организатор: ${data.organizer}`,
        data.registration_time && `Регистрация: ${data.registration_time}`,
        data.start_time && `Начало: ${data.start_time}`,
        data.awards && `🏆 Награды: ${data.awards}`,                   // ← НОВОЕ
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
        return { success: false, error: mapPgError(tournamentError, 'создать турнир') }
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
        await supabase.from('tournaments').delete().eq('id', tournament.id)
        return { success: false, error: mapPgError(categoriesError, 'создать категории') }
    }



    revalidatePath('/tournaments')
    revalidatePath('/home')

    return { success: true, data: { id: tournament.id } }
}








// ----------- турниры -----------------

// редактирование

export async function updateTournament(
    id: string,
    input: {
        title: string;
        tournament_type: "home" | "away";
        organizer: string | null;
        city: string;
        venue_name: string | null;
        venue_address: string | null;
        start_date: string;
        end_date: string | null;
        registration_time: string | null;
        start_time: string | null;
        awards: string | null;
        registration_deadline: string | null;
        entry_fee: number | null;
        entry_fee_note: string | null;
        description: string | null;
        contact_info: string | null;
        pdf_url: string | null;
        pdf_storage_path: string | null;
        categories: { category: "MS" | "WS" | "MD" | "WD" | "XD"; age_group: string | null }[]
    }
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
        return { success: false, error: 'Только тренер может редактировать турниры' }
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

    // Получаем текущий турнир (чтобы удалить старый PDF если заменён)
    const { data: existing } = await supabase
        .from('tournaments')
        .select('pdf_storage_path')
        .eq('id', id)
        .single()

    if (!existing) {
        return { success: false, error: 'Турнир не найден' }
    }

    // Если PDF был заменён — удаляем старый из storage
    if (
        existing.pdf_storage_path &&
        existing.pdf_storage_path !== data.pdf_storage_path
    ) {
        await supabase.storage
            .from('tournament-pdfs')
            .remove([existing.pdf_storage_path])
    }

    // Собираем location
    const location = [data.city, data.venue_name, data.venue_address]
        .filter(Boolean)
        .join(', ')

    // extendedDescription
    const extendedDescription = [
        data.description,
        data.organizer && `Организатор: ${data.organizer}`,
        data.registration_time && `Регистрация: ${data.registration_time}`,
        data.start_time && `Начало: ${data.start_time}`,
        data.awards && `🏆 Награды: ${data.awards}`,                   // ← НОВОЕ
        data.entry_fee_note && `Взнос: ${data.entry_fee_note}`,
        data.contact_info && `Контакты: ${data.contact_info}`,
    ].filter(Boolean).join('\n\n')

    // Обновляем турнир
    const { error: updateError } = await supabase
        .from('tournaments')
        .update({
            title: data.title,
            tournament_type: data.tournament_type,
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
        })
        .eq('id', id)

    if (updateError) {
        console.error('Failed to update tournament:', updateError)
        return { success: false, error: mapPgError(updateError, 'обновить турнир') }
    }

    // Обновляем категории: сначала удаляем старые, потом создаём новые
    // (проще чем diff — категорий немного, участники ссылаются на них через category_id,
    // но при редактировании категорий в анонсе это редкая операция)
    const { data: existingCategories } = await supabase
        .from('tournament_categories')
        .select('id')
        .eq('tournament_id', id)

    // Проверяем есть ли участники в текущих категориях
    if (existingCategories && existingCategories.length > 0) {
        const categoryIds = existingCategories.map(c => c.id)
        const { count } = await supabase
            .from('tournament_participants')
            .select('id', { count: 'exact', head: true })
            .in('category_id', categoryIds)

        if (count && count > 0) {
            // Есть участники — не даём удалить/пересоздать категории
            // Просто оставляем как есть, чтобы не потерять регистрации
            // (В UI надо предупреждать тренера)
        } else {
            // Участников нет — безопасно пересоздаём
            await supabase
                .from('tournament_categories')
                .delete()
                .eq('tournament_id', id)

            const categoriesInsert = data.categories.map((c) => ({
                tournament_id: id,
                category: c.category,
                age_group: c.age_group,
                max_pairs: null,
                bracket_format: null,
                bracket_generated: false,
                participants_count: 0,
            }))

            await supabase.from('tournament_categories').insert(categoriesInsert)
        }
    } else {
        // Категорий вообще не было — создаём новые
        const categoriesInsert = data.categories.map((c) => ({
            tournament_id: id,
            category: c.category,
            age_group: c.age_group,
            max_pairs: null,
            bracket_format: null,
            bracket_generated: false,
            participants_count: 0,
        }))

        await supabase.from('tournament_categories').insert(categoriesInsert)
    }

    revalidatePath('/tournaments')
    revalidatePath(`/tournaments/${id}`)
    revalidatePath('/home')

    return { success: true, data: { id } }
}


// удаление турнира


export async function deleteTournament(id: string): Promise<ActionResult> {
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
        return { success: false, error: 'Только тренер может удалять турниры' }
    }

    // Получаем PDF, чтобы удалить из storage
    const { data: tournament } = await supabase
        .from('tournaments')
        .select('pdf_storage_path')
        .eq('id', id)
        .single()

    // Удаляем PDF из storage если есть
    if (tournament?.pdf_storage_path) {
        await supabase.storage
            .from('tournament-pdfs')
            .remove([tournament.pdf_storage_path])
    }

    // Удаляем турнир (каскад по FK удалит категории, участников, матчи)
    const { error } = await supabase.from('tournaments').delete().eq('id', id)

    if (error) {
        console.error('Failed to delete tournament:', error)
        return { success: false, error: mapPgError(error, 'удалить турнир') }
    }

    revalidatePath('/tournaments')
    revalidatePath('/home')

    return { success: true }
}










// ---------------- для выбора партнёра ------------------


export type PlayerSearchResult = {
    id: string
    full_name: string
    avatar_url: string | null
    role: 'coach' | 'player'
    gender: 'male' | 'female' | null
}

export async function searchPlayers(
    query: string,
    filterGender?: 'male' | 'female' | null
): Promise<ActionResult<PlayerSearchResult[]>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    const cleanQuery = query.trim().slice(0, 50)

    const { data, error } = await supabase.rpc('search_players_for_partner', {
        search_query: cleanQuery,
        exclude_user_id: user.id,
        result_limit: 10,
        filter_gender: filterGender ?? undefined,
    })

    if (error) {
        console.error('Failed to search players:', error)
        return { success: false, error: 'Не удалось загрузить игроков' }
    }

    return { success: true, data: (data ?? []) as PlayerSearchResult[] }
}

// ============================================================
// REGISTER FOR TOURNAMENT
// ============================================================

/**
 * Один слот регистрации от игрока:
 *   category_id: в какую категорию записываемся
 *   partner: null (одиночная категория ИЛИ парная без партнёра «ищу»)
 *          | { kind: 'player', player_id: uuid } — партнёр из клуба
 *          | { kind: 'guest', full_name: string } — партнёр гость (ручной ввод)
 *          | { kind: 'join', record_id: uuid } — присоединяюсь к тому кто «ищет партнёра»
 */
type PartnerInput =
    | null
    | { kind: 'player'; player_id: string }
    | { kind: 'guest'; full_name: string }
    | { kind: 'join'; record_id: string }

export type RegistrationSlot = {
    category_id: string
    partner: PartnerInput
}

const partnerSchema = z.union([
    z.null(),
    z.object({ kind: z.literal('player'), player_id: z.string().uuid() }),
    z.object({ kind: z.literal('guest'), full_name: z.string().min(2).max(100) }),
    z.object({ kind: z.literal('join'), record_id: z.string().uuid() }),
])

const registerForTournamentSchema = z.object({
    tournament_id: z.string().uuid(),
    slots: z.array(z.object({
        category_id: z.string().uuid(),
        partner: partnerSchema,
    })).min(1, 'Выбери хотя бы одну категорию'),
})

const PAIR_CATEGORIES = new Set(['MD', 'WD', 'XD'])

export async function registerForTournament(input: {
    tournament_id: string
    slots: RegistrationSlot[]
}): Promise<ActionResult<{ created_count: number }>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.REGISTER_TOURNAMENT)
    if (!rateLimit.allowed) {
        return { success: false, error: rateLimit.error }
    }

    const parsed = registerForTournamentSchema.safeParse(input)
    if (!parsed.success) {
        return {
            success: false,
            error: 'Проверь введённые данные',
            fieldErrors: extractFieldErrors(parsed.error),
        }
    }


    const { tournament_id, slots } = parsed.data

    // Проверяем что турнир существует и дедлайн ещё не прошёл
    const { data: tournament } = await supabase
        .from('tournaments')
        .select('id, registration_deadline, start_date')
        .eq('id', tournament_id)
        .single()

    if (!tournament) {
        return { success: false, error: 'Турнир не найден' }
    }

    // Проверка дедлайна регистрации
    const now = new Date()
    if (tournament.registration_deadline) {
        const deadline = new Date(tournament.registration_deadline)
        if (deadline < now) {
            return { success: false, error: 'Регистрация уже закрыта' }
        }
    } else {
        // Если дедлайна нет — используем start_date как предельную дату
        const startDate = new Date(tournament.start_date)
        if (startDate < now) {
            return { success: false, error: 'Турнир уже начался' }
        }
    }

    // Загружаем все категории турнира одним запросом
    const categoryIds = slots.map(s => s.category_id)
    const { data: categoriesData } = await supabase
        .from('tournament_categories')
        .select('id, category, tournament_id')
        .in('id', categoryIds)

    const categoriesMap = new Map(
        (categoriesData ?? []).map(c => [c.id, c])
    )

    // Проверяем что все категории принадлежат этому турниру
    for (const slot of slots) {
        const cat = categoriesMap.get(slot.category_id)
        if (!cat || cat.tournament_id !== tournament_id) {
            return { success: false, error: 'Некорректная категория' }
        }
    }

    // Проверяем что игрок ещё не записан ни в одну из выбранных категорий
    const { data: existingRecords } = await supabase
        .from('tournament_participants')
        .select('category_id, player1_id, player2_id')
        .eq('tournament_id', tournament_id)
        .in('category_id', categoryIds)
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)

    if (existingRecords && existingRecords.length > 0) {
        return {
            success: false,
            error: 'Ты уже записан в одну из выбранных категорий',
        }
    }

    // Обрабатываем каждый слот
    let createdCount = 0
    const createdGuestIds: string[] = []  // для отката если что

    try {
        for (const slot of slots) {
            const cat = categoriesMap.get(slot.category_id)!
            const isPairCategory = PAIR_CATEGORIES.has(cat.category)

            // Валидация: одиночка не может иметь партнёра
            if (!isPairCategory && slot.partner !== null) {
                throw new Error(`Для одиночной категории партнёр не нужен`)
            }

            // ============ Case: joining existing "seeker" ============
            if (slot.partner?.kind === 'join') {
                // Присоединяюсь к записи «Игрок X ищет партнёра»
                const { data: targetRecord } = await supabase
                    .from('tournament_participants')
                    .select('id, player1_id, player2_id, guest2_id, category_id')
                    .eq('id', slot.partner.record_id)
                    .single()

                if (!targetRecord) {
                    throw new Error('Запись «ищет партнёра» не найдена')
                }
                if (targetRecord.category_id !== slot.category_id) {
                    throw new Error('Категория не совпадает')
                }
                if (targetRecord.player2_id || targetRecord.guest2_id) {
                    throw new Error('У этой записи уже есть партнёр')
                }
                if (targetRecord.player1_id === user.id) {
                    throw new Error('Нельзя стать партнёром самому себе')
                }

                // Обновляем запись: становлюсь player2, статус confirmed (я сам согласился)
                const { data: updated, error: updateError } = await supabase
                    .from('tournament_participants')
                    .update({
                        player2_id: user.id,
                        pair_status: 'confirmed',
                    })
                    .eq('id', slot.partner.record_id)
                    .is('player2_id', null)
                    .is('guest2_id', null)
                    .select('id')

                if (updateError) {
                    throw new Error(mapPgError(updateError, 'присоединиться к паре'))
                }
                if (!updated || updated.length === 0) {
                    throw new Error('Кто-то уже стал партнёром в этой записи')
                }
                createdCount++
                continue
            }

            // ============ Case: new record ============
            let guest2Id: string | null = null

            if (slot.partner?.kind === 'guest') {
                // Rate limit на создание гостей
                const guestLimit = await checkRateLimit(user.id, RATE_LIMITS.CREATE_GUEST)
                if (!guestLimit.allowed) {
                    throw new Error(guestLimit.error)
                }

                // Создаём гостя
                const { data: newGuest, error: guestError } = await supabase
                    .from('guests')
                    .insert({
                        full_name: slot.partner.full_name.trim(),
                        created_by: user.id,
                    })
                    .select('id')
                    .single()

                if (guestError || !newGuest) {
                    throw new Error(mapPgError(guestError, 'создать гостя'))
                }
                guest2Id = newGuest.id
                createdGuestIds.push(newGuest.id)
            }

            const player2Id: string | null =
                slot.partner?.kind === 'player' ? slot.partner.player_id : null

            if (player2Id) {
                const { count: pendingCount } = await supabase
                    .from('tournament_participants')
                    .select('id', { count: 'exact', head: true })
                    .eq('player1_id', user.id)
                    .eq('player2_id', player2Id)
                    .eq('pair_status', 'pending')

                if (pendingCount !== null && pendingCount >= 3) {
                    throw new Error('Ты уже пригласил этого игрока в 3 турнира. Дождись ответа.')
                }
            }


            // Если пара и партнёр — гость → сразу confirmed
            // Если пара и партнёр — игрок клуба → pending (ждём подтверждения)
            // Если пара и партнёра нет → pending (ищу партнёра)
            // Если одиночка → pair_status null
            let pairStatus: 'pending' | 'confirmed' | null = null
            if (isPairCategory) {
                if (guest2Id) {
                    pairStatus = 'confirmed'
                } else {
                    pairStatus = 'pending'
                }
            }

            const { error: insertError } = await supabase
                .from('tournament_participants')
                .insert({
                    tournament_id,
                    category_id: slot.category_id,
                    player1_id: user.id,
                    player2_id: player2Id,
                    guest1_id: null,
                    guest2_id: guest2Id,
                    status: 'registered',
                    pair_status: pairStatus,
                    registered_by: user.id,
                })

            if (insertError) throw new Error(mapPgError(insertError, 'зарегистрироваться'))
            createdCount++
        }
    } catch (err) {
        // Откатываем созданных гостей
        if (createdGuestIds.length > 0) {
            await supabase.from('guests').delete().in('id', createdGuestIds)
        }
        console.error('Registration failed:', err)
        const message = err instanceof Error ? err.message : 'Ошибка регистрации'
        return { success: false, error: message }
    }

    revalidatePath(`/tournaments/${tournament_id}`)
    revalidatePath('/home')

    return { success: true, data: { created_count: createdCount } }
}

// ============================================================
// CONFIRM / DECLINE PAIR (партнёр отвечает на приглашение)
// ============================================================

export async function respondToPairInvite(
    participantId: string,
    response: 'confirm' | 'decline'
): Promise<ActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    // Rate limit
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.RESPOND_INVITE)
    if (!rateLimit.allowed) {
        return { success: false, error: rateLimit.error }
    }

    // Загружаем запись
    const { data: record } = await supabase
        .from('tournament_participants')
        .select('id, player1_id, player2_id, pair_status, tournament_id')
        .eq('id', participantId)
        .single()

    if (!record) {
        return { success: false, error: 'Запись не найдена' }
    }

    // Проверяем что я - player2 (приглашённый) или тренер
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    const isCoach = profile?.role === 'coach'

    if (!isCoach && record.player2_id !== user.id) {
        return { success: false, error: 'Только приглашённый игрок или тренер может ответить' }
    }

    if (record.pair_status !== 'pending') {
        return { success: false, error: 'Приглашение уже обработано' }
    }

    if (response === 'confirm') {
        const { error } = await supabase
            .from('tournament_participants')
            .update({ pair_status: 'confirmed' })
            .eq('id', participantId)

        if (error) {
            return { success: false, error: mapPgError(error, 'подтвердить приглашение') }
        }
    } else {
        // decline — обнуляем player2, статус declined
        // (тем самым player1 становится «seeker», а вся запись видна другим для join)
        const { error } = await supabase
            .from('tournament_participants')
            .update({
                pair_status: 'declined',
                player2_id: null,
            })
            .eq('id', participantId)

        if (error) {
            return { success: false, error: mapPgError(error, 'отклонить приглашение') }
        }

        // Через 1 запрос обновим статус обратно на pending чтобы запись выглядела
        // как «ищет партнёра», а не «отклонено»
        // (declined мы использовали только чтобы обнулить player2_id безопасно;
        // теперь запись = seeker без партнёра)
        await supabase
            .from('tournament_participants')
            .update({ pair_status: 'pending' })
            .eq('id', participantId)
    }

    revalidatePath(`/tournaments/${record.tournament_id}`)
    revalidatePath('/home')

    return { success: true }
}

// ============================================================
// CANCEL REGISTRATION (сам игрок или тренер удаляет запись)
// ============================================================

export async function cancelRegistration(
    participantId: string
): Promise<ActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    // Загружаем запись + турнир
    const { data: record } = await supabase
        .from('tournament_participants')
        .select('id, tournament_id, registered_by, player1_id, player2_id, guest2_id, guest1_id, tournaments(registration_deadline, start_date)')
        .eq('id', participantId)
        .single()

    if (!record) {
        return { success: false, error: 'Запись не найдена' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    const isCoach = profile?.role === 'coach'

    // Права: тренер — всегда; иначе — только регистратор
    if (!isCoach) {
        if (record.registered_by !== user.id) {
            return { success: false, error: 'Нет прав на отмену этой записи' }
        }
        // Проверка дедлайна для игрока
        const tournament = record.tournaments as unknown as {
            registration_deadline: string | null
            start_date: string
        } | null
        if (tournament) {
            const now = new Date()
            const deadline = tournament.registration_deadline
                ? new Date(tournament.registration_deadline)
                : new Date(tournament.start_date)
            if (deadline < now) {
                return {
                    success: false,
                    error: 'Отменить регистрацию после закрытия может только тренер',
                }
            }
        }
    }

    // Собираем ID гостей, которых надо удалить (создавались только для этой пары)
    const guestIdsToDelete: string[] = []
    if (record.guest1_id) guestIdsToDelete.push(record.guest1_id)
    if (record.guest2_id) guestIdsToDelete.push(record.guest2_id)

    // Удаляем запись
    const { error } = await supabase
        .from('tournament_participants')
        .delete()
        .eq('id', participantId)

    if (error) {
        console.error('Failed to cancel registration:', error)
        return { success: false, error: 'Не удалось отменить регистрацию' }
    }

    // Удаляем гостей (могут не удалиться если на них ссылки в других записях —
    // Postgres не даст, тихо проигнорируем)
    if (guestIdsToDelete.length > 0) {
        await supabase.from('guests').delete().in('id', guestIdsToDelete)
    }

    revalidatePath(`/tournaments/${record.tournament_id}`)
    revalidatePath('/home')

    return { success: true }
}


/**
 * Убрать партнёра из пары.
 * Может делать: тренер, player1 или player2.
 * Тот кто нажал — остаётся в записи, другой обнуляется.
 * Если нажал player2 — он становится player1.
 */
export async function removePartner(
    participantId: string
): Promise<ActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    const { data: record } = await supabase
        .from('tournament_participants')
        .select('id, tournament_id, player1_id, player2_id, guest2_id')
        .eq('id', participantId)
        .single()

    if (!record) {
        return { success: false, error: 'Запись не найдена' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    const isCoach = profile?.role === 'coach'

    const iAmPlayer1 = record.player1_id === user.id
    const iAmPlayer2 = record.player2_id === user.id

    if (!isCoach && !iAmPlayer1 && !iAmPlayer2) {
        return { success: false, error: 'Только участник пары или тренер может убрать партнёра' }
    }

    // Гость, если был — удалим (не имеет владельца в системе)
    const guestIdToDelete = record.guest2_id

    // Определяем что оставить в записи
    let updatePayload: {
        player1_id: string | null
        player2_id: null
        guest2_id: null
        pair_status: 'pending'
    }

    if (iAmPlayer2) {
        // Я player2, убираю player1 → сам становлюсь player1
        updatePayload = {
            player1_id: user.id,
            player2_id: null,
            guest2_id: null,
            pair_status: 'pending',
        }
    } else {
        // Я player1 или тренер → оставляем player1 как есть, убираем player2/guest2
        updatePayload = {
            player1_id: record.player1_id,
            player2_id: null,
            guest2_id: null,
            pair_status: 'pending',
        }
    }

    const { error } = await supabase
        .from('tournament_participants')
        .update(updatePayload)
        .eq('id', participantId)

    if (error) {
        console.error('Failed to remove partner:', error)
        return { success: false, error: 'Не удалось убрать партнёра' }
    }

    if (guestIdToDelete) {
        await supabase.from('guests').delete().eq('id', guestIdToDelete)
    }

    revalidatePath(`/tournaments/${record.tournament_id}`)
    revalidatePath('/home')

    return { success: true }
}