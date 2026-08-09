'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/shared/lib/actions/types'
import type { AttendanceStatus, TrainingStatus } from '@/types'

// ============================================
// ОТМЕТКА "ПРИДУ / НЕ ПРИДУ" (вызывается с главной)
// ============================================
export async function setAttendance(
    trainingId: string,
    status: AttendanceStatus
): Promise<ActionResult> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Нужно войти' }

    const { error } = await supabase.from('training_attendance').upsert(
        {
            training_id: trainingId,
            player_id: user.id,
            status,
            responded_at: new Date().toISOString(),
        },
        { onConflict: 'training_id,player_id' }
    )

    if (error) return { success: false, error: 'Не удалось сохранить' }

    revalidatePath('/home')
    revalidatePath('/schedule')
    return { success: true }
}

// ============================================
// БЫСТРАЯ ОТМЕНА БЛИЖАЙШЕЙ ТРЕНИРОВКИ
// ============================================
export async function cancelNextTraining(
    trainingId: string
): Promise<ActionResult> {
    const supabase = await createClient()

    const { error: updateError } = await supabase
        .from('trainings')
        .update({
            status: 'cancelled' as TrainingStatus,
            status_note: 'Тренер не сможет быть',
        })
        .eq('id', trainingId)

    if (updateError) {
        if (updateError.code === '42501') {
            return { success: false, error: 'Только тренер может отменять' }
        }
        return { success: false, error: 'Не удалось отменить' }
    }

    // Создаём автопост-объявление
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user) {
        // Получаем дату тренировки для поста
        const { data: training } = await supabase
            .from('trainings')
            .select('date, start_time, training_group')
            .eq('id', trainingId)
            .single()

        if (training) {
            const dateStr = new Date(training.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                weekday: 'long',
            })

            await supabase.from('posts').insert({
                author_id: user.id,
                title: '❌ Тренировка отменена',
                content: `Тренировка ${dateStr} отменена.\nТренер не сможет быть.`,
                post_type: 'auto',
                is_pinned: true,
                pinned_at: new Date().toISOString(),
            })
        }
    }

    revalidatePath('/home')
    revalidatePath('/feed')
    revalidatePath('/schedule')
    return { success: true }
}

// ============================================
// МАССОВОЕ ИЗМЕНЕНИЕ СТАТУСА (диапазон дат)
// ============================================
export async function updateTrainingsInRange(
    startDate: string,
    endDate: string,
    status: TrainingStatus,
    customNote?: string
): Promise<ActionResult> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Нужно войти' }

    // Автозаметка по причине
    const autoNotes: Record<string, string> = {
        cancelled: 'Тренировки отменены',
        holiday: 'Праздничные дни — тренировок не будет',
        tournament_trip: 'Клуб на турнире — тренировок не будет',
        no_coach_open: 'Тренера не будет, зал открыт для самостоятельных занятий',
        substitute: 'На тренировках будет замена тренера',
    }

    const note = customNote?.trim() || autoNotes[status] || ''

    // Обновляем только тренировки в диапазоне (НЕ все дни)
    const { data: affected, error } = await supabase
        .from('trainings')
        .update({
            status,
            status_note: note || null,
        })
        .gte('date', startDate)
        .lte('date', endDate)
        .neq('status', status)
        .select('id, date, training_group')

    if (error) {
        if (error.code === '42501') {
            return { success: false, error: 'Только тренер может менять расписание' }
        }
        return { success: false, error: 'Не удалось обновить' }
    }

    const count = affected?.length || 0

    if (count === 0) {
        return { success: false, error: 'Нет тренировок в этом периоде' }
    }

    // Создаём автопост
    const startStr = new Date(startDate).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
    })
    const endStr = new Date(endDate).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
    })

    const statusIcons: Record<string, string> = {
        cancelled: '❌',
        holiday: '🎉',
        tournament_trip: '🏆',
        no_coach_open: '🔓',
        substitute: '👤',
        normal: '🏸',
    }

    const icon = statusIcons[status] || '📢'

    const postTitle = `${icon} Изменение в расписании`
    const postContent = `${note}\n\nПериод: ${startStr} — ${endStr}\nЗатронуто тренировок: ${count}`

    await supabase.from('posts').insert({
        author_id: user.id,
        title: postTitle,
        content: postContent,
        post_type: 'auto',
        is_pinned: true,
        pinned_at: new Date().toISOString(),
    })

    revalidatePath('/home')
    revalidatePath('/feed')
    revalidatePath('/schedule')
    return { success: true }
}

// ============================================
// ОБНОВЛЕНИЕ ОДНОЙ ТРЕНИРОВКИ
// ============================================
export async function updateTrainingStatus(
    trainingId: string,
    status: TrainingStatus,
    note?: string,
    substituteName?: string
): Promise<ActionResult> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('trainings')
        .update({
            status,
            status_note: note || null,
            substitute_name: substituteName || null,
        })
        .eq('id', trainingId)

    if (error) {
        if (error.code === '42501') {
            return { success: false, error: 'Только тренер может изменять' }
        }
        return { success: false, error: 'Не удалось обновить' }
    }

    revalidatePath('/schedule')
    revalidatePath('/home')
    return { success: true }
}

// ============================================
// ГЕНЕРАЦИЯ ТРЕНИРОВОК
// ============================================
export async function generateTrainings(months: number = 1): Promise<ActionResult> {
    const supabase = await createClient()

    const { error } = await supabase.rpc('generate_trainings', {
        start_date: new Date().toISOString().split('T')[0],
        months_ahead: months,
    })

    if (error) {
        return { success: false, error: 'Не удалось сгенерировать' }
    }

    revalidatePath('/schedule')
    return { success: true }
}