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

    // Скачиваем PDF из storage
    const { data: fileData, error: downloadError } = await supabase.storage
        .from('tournament-pdfs')
        .download(storagePath)

    if (downloadError || !fileData) {
        console.error('PDF download failed:', downloadError)
        return { success: false, error: 'Не удалось прочитать файл' }
    }

    const buffer = await fileData.arrayBuffer()

    // Парсинг через Gemini
    try {
        const parsed = await parseTournamentPdf(new Uint8Array(buffer))
        return { success: true, data: parsed }
    } catch (err) {
        console.error('AI parsing failed:', err)

        const message = err instanceof Error ? err.message : ''
        const lower = message.toLowerCase()

        // 404 — модель не найдена / удалена
        if (lower.includes('404') || lower.includes('not_found') || lower.includes('no longer available')) {
            return {
                success: false,
                error: 'Модель AI недоступна. Обратись к разработчику для обновления.',
            }
        }

        // 401/403 — проблемы с ключом
        if (lower.includes('401') || lower.includes('403') || lower.includes('api key') || lower.includes('permission_denied')) {
            return {
                success: false,
                error: 'Ошибка доступа к AI. Обратись к разработчику.',
            }
        }

        // 429 — rate limit / quota
        if (lower.includes('429') || lower.includes('rate_limit') || lower.includes('quota') || lower.includes('resource_exhausted')) {
            return {
                success: false,
                error: 'Слишком много запросов к AI. Попробуй через минуту.',
            }
        }

        // 400 — проблема с самим запросом/файлом
        if (lower.includes('400') || lower.includes('invalid_argument')) {
            return {
                success: false,
                error: 'Не удалось прочитать PDF. Попробуй другой файл.',
            }
        }

        // Всё остальное — общая ошибка
        return {
            success: false,
            error: 'Не удалось автоматически распознать положение. Заполни поля вручную.',
        }
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