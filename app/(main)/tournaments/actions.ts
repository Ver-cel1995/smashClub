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

    // Парсинг через OpenAI
    try {
        const parsed = await parseTournamentPdf(buffer)
        return { success: true, data: parsed }
    } catch (err) {
        console.error('AI parsing failed:', err)

        // Различаем типы ошибок для более понятного сообщения
        const message = err instanceof Error ? err.message : ''

        if (message.includes('rate_limit') || message.includes('429')) {
            return {
                success: false,
                error: 'Слишком много запросов к AI. Попробуй через минуту.',
            }
        }

        if (message.includes('insufficient_quota')) {
            return {
                success: false,
                error: 'Исчерпан лимит AI на сегодня. Заполни поля вручную.',
            }
        }

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