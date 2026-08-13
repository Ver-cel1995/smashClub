'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/shared/lib/auth'
import type { ActionResult } from '@/shared/lib/actions/types'
import type { Database } from '@/types/database'
import { checkRateLimit } from '@/shared/lib/rate-limit'
import { mapPgError } from '@/shared/lib/actions/pg-errors'

// ============================================================
// Rate limit config
// ============================================================
const FEEDBACK_RATE_LIMIT = {
    action: 'send_feedback',
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 5 сообщений в час
    errorMessage: 'Слишком много сообщений. Попробуй позже.',
}

// ============================================================
// Типы
// ============================================================
export type FeedbackRow = Database['public']['Tables']['feedback']['Row']
export type FeedbackType = 'bug' | 'idea' | 'other'
export type FeedbackStatus = 'new' | 'seen' | 'in_progress' | 'done' | 'rejected'

export type FeedbackWithAuthor = FeedbackRow & {
    author: {
        id: string
        full_name: string
        avatar_url: string | null
        role: string
    } | null
}

// ============================================================
// Zod schema
// ============================================================
const sendFeedbackSchema = z.object({
    type: z.enum(['bug', 'idea', 'other']),
    title: z.string().min(3, 'Заголовок минимум 3 символа').max(200),
    description: z.string().min(10, 'Опиши подробнее (минимум 10 символов)').max(3000),
    screenshot_url: z.string().url().nullable(),
    screenshot_storage_path: z.string().nullable(),
})

export type SendFeedbackInput = z.infer<typeof sendFeedbackSchema>

// ============================================================
// UPLOAD SCREENSHOT
// ============================================================
export async function uploadFeedbackScreenshot(
    formData: FormData
): Promise<ActionResult<{ url: string; path: string }>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Нужно войти в аккаунт' }

    const file = formData.get('screenshot') as File | null
    if (!file || file.size === 0) {
        return { success: false, error: 'Файл не выбран' }
    }
    if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Только изображения' }
    }
    if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'Файл больше 5 МБ' }
    }

    const timestamp = Date.now()
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${user.id}/${timestamp}.${ext}`

    const { error: uploadError } = await supabase.storage
        .from('feedback-screenshots')
        .upload(path, file, {
            contentType: file.type,
            upsert: false,
        })

    if (uploadError) {
        console.error('Feedback screenshot upload failed:', uploadError)
        return { success: false, error: 'Не удалось загрузить скриншот' }
    }

    const { data: { publicUrl } } = supabase.storage
        .from('feedback-screenshots')
        .getPublicUrl(path)

    return { success: true, data: { url: publicUrl, path } }
}

// ============================================================
// SEND FEEDBACK
// ============================================================
export async function sendFeedback(
    input: SendFeedbackInput
): Promise<ActionResult<{ id: string }>> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Нужно войти' }

    const rateLimit = await checkRateLimit(user.userId, FEEDBACK_RATE_LIMIT)
    if (!rateLimit.allowed) {
        return { success: false, error: rateLimit.error }
    }

    const parsed = sendFeedbackSchema.safeParse(input)
    if (!parsed.success) {
        const fieldErrors: Record<string, string> = {}
        for (const issue of parsed.error.issues) {
            fieldErrors[issue.path[0] as string] = issue.message
        }
        return { success: false, error: 'Проверь поля', fieldErrors }
    }

    const supabase = await createClient()
    const { data: created, error } = await supabase
        .from('feedback')
        .insert({
            user_id: user.userId,
            type: parsed.data.type,
            title: parsed.data.title.trim(),
            description: parsed.data.description.trim(),
            screenshot_url: parsed.data.screenshot_url,
            screenshot_storage_path: parsed.data.screenshot_storage_path,
            status: 'new',
        })
        .select('id')
        .single()

    if (error || !created) {
        console.error('[sendFeedback]', error)
        return { success: false, error: mapPgError(error, 'отправить обращение') }
    }

    revalidatePath('/profile/feedback')
    revalidatePath('/profile/feedback/admin')
    return { success: true, data: { id: created.id } }
}

// ============================================================
// GET MY FEEDBACK
// ============================================================
export async function getMyFeedback(): Promise<FeedbackRow[]> {
    const user = await getCurrentUser()
    if (!user) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[getMyFeedback]', error)
        return []
    }
    return data ?? []
}

// ============================================================
// GET ALL FEEDBACK (dev only)
// ============================================================
export async function getAllFeedback(
    filter?: { status?: FeedbackStatus; type?: FeedbackType }
): Promise<FeedbackWithAuthor[]> {
    const user = await getCurrentUser()
    if (!user || user.profile.role !== 'development') return []

    const supabase = await createClient()

    let query = supabase
        .from('feedback')
        .select(`
            *,
            author:profiles!feedback_user_id_fkey(id, full_name, avatar_url, role)
        `)
        .order('created_at', { ascending: false })

    if (filter?.status) query = query.eq('status', filter.status)
    if (filter?.type) query = query.eq('type', filter.type)

    const { data, error } = await query

    if (error) {
        console.error('[getAllFeedback]', error)
        return []
    }

    return (data ?? []) as unknown as FeedbackWithAuthor[]
}

// ============================================================
// UPDATE STATUS + REPLY (dev only)
// ============================================================
export async function updateFeedback(
    id: string,
    input: { status?: FeedbackStatus; dev_reply?: string | null }
): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user || user.profile.role !== 'development') {
        return { success: false, error: 'Только для разработчика' }
    }

    const supabase = await createClient()

    const updatePayload: Record<string, unknown> = {}
    if (input.status !== undefined) updatePayload.status = input.status
    if (input.dev_reply !== undefined) {
        updatePayload.dev_reply = input.dev_reply?.trim() || null
        updatePayload.dev_reply_at = input.dev_reply ? new Date().toISOString() : null
    }

    if (Object.keys(updatePayload).length === 0) {
        return { success: false, error: 'Нечего обновлять' }
    }

    const { error } = await supabase
        .from('feedback')
        .update(updatePayload)
        .eq('id', id)

    if (error) {
        console.error('[updateFeedback]', error)
        return { success: false, error: mapPgError(error, 'обновить обращение') }
    }

    revalidatePath('/profile/feedback')
    revalidatePath('/profile/feedback/admin')
    return { success: true }
}

// ============================================================
// DELETE FEEDBACK
// ============================================================
export async function deleteFeedback(id: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Нужно войти' }

    const supabase = await createClient()

    // Загружаем чтобы узнать storage_path для очистки
    const { data: feedback } = await supabase
        .from('feedback')
        .select('screenshot_storage_path, user_id')
        .eq('id', id)
        .single()

    if (!feedback) {
        return { success: false, error: 'Обращение не найдено' }
    }

    const canDelete =
        user.profile.role === 'development' || feedback.user_id === user.userId

    if (!canDelete) {
        return { success: false, error: 'Нет прав' }
    }

    const { error } = await supabase.from('feedback').delete().eq('id', id)

    if (error) {
        console.error('[deleteFeedback]', error)
        return { success: false, error: mapPgError(error, 'удалить обращение') }
    }

    // Удаляем скриншот из storage если был
    if (feedback.screenshot_storage_path) {
        await supabase.storage
            .from('feedback-screenshots')
            .remove([feedback.screenshot_storage_path])
    }

    revalidatePath('/profile/feedback')
    revalidatePath('/profile/feedback/admin')
    return { success: true }
}