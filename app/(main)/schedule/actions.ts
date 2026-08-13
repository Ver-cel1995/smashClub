'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/shared/lib/actions/types'
import type { AttendanceStatus, TrainingStatus } from '@/types'

// ============================================
// Helpers
// ============================================

/**
 * Формирует auto_expires_at на основе последней затронутой даты тренировки.
 * Возвращает ISO строку: следующий день после trainingDate в 00:00 UTC.
 */
function computeAutoExpiresAt(trainingDate: string): string {
    // trainingDate = 'YYYY-MM-DD'
    const [year, month, day] = trainingDate.split('-').map(Number)
    // Следующий день в 00:00 UTC
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0))
    return nextDay.toISOString()
}

const STATUS_ICONS: Record<string, string> = {
    cancelled: '❌',
    holiday: '🎉',
    tournament_trip: '🏆',
    no_coach_open: '🔓',
    substitute: '👤',
    normal: '🏸',
}

// ============================================
// ОТМЕТКА "ПРИДУ / НЕ ПРИДУ"
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

    // Сначала получаем инфу о тренировке (нужна дата для auto_expires_at)
    const { data: training } = await supabase
        .from('trainings')
        .select('date, start_time, training_group')
        .eq('id', trainingId)
        .single()

    if (!training) {
        return { success: false, error: 'Тренировка не найдена' }
    }

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
            auto_expires_at: computeAutoExpiresAt(training.date),   // ← НОВОЕ
        })
    }

    revalidatePath('/home')
    revalidatePath('/feed')
    revalidatePath('/schedule')
    return { success: true }
}

// ============================================
// МАССОВОЕ ИЗМЕНЕНИЕ СТАТУСА
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

    const autoNotes: Record<string, string> = {
        cancelled: 'Тренировки отменены',
        holiday: 'Праздничные дни — тренировок не будет',
        tournament_trip: 'Клуб на турнире — тренировок не будет',
        no_coach_open: 'Тренера не будет, зал открыт для самостоятельных занятий',
        substitute: 'На тренировках будет замена тренера',
    }

    const note = customNote?.trim() || autoNotes[status] || ''

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
        return {
            success: false,
            error: 'В выбранном периоде нет тренировок для изменения',
        }
    }

    const startStr = new Date(startDate).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
    })
    const endStr = new Date(endDate).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
    })

    const icon = STATUS_ICONS[status] || '📢'
    const postTitle = `${icon} Изменение в расписании`
    const postContent = `${note}\n\nПериод: ${startStr} — ${endStr}\nЗатронуто тренировок: ${count}`

    await supabase.from('posts').insert({
        author_id: user.id,
        title: postTitle,
        content: postContent,
        post_type: 'auto',
        is_pinned: true,
        pinned_at: new Date().toISOString(),
        auto_expires_at: computeAutoExpiresAt(endDate),   // ← НОВОЕ
    })

    revalidatePath('/home')
    revalidatePath('/feed')
    revalidatePath('/schedule')
    return { success: true }
}

// ============================================
// ОБНОВЛЕНИЕ ОДНОЙ ТРЕНИРОВКИ (с поддержкой смены времени)
// ============================================
export async function updateTrainingStatus(
    trainingId: string,
    status: TrainingStatus,
    note?: string,
    substituteName?: string,
    /** Новое: смена start_time — используется в табе «Изменить время» и «Турнир» */
    customStartTime?: string
): Promise<ActionResult> {
    const supabase = await createClient()

    const updatePayload: Record<string, unknown> = {
        status,
        status_note: note || null,
        substitute_name: substituteName || null,
    }

    if (customStartTime) {
        updatePayload.start_time = customStartTime
    }

    const { error } = await supabase
        .from('trainings')
        .update(updatePayload)
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
// СОЗДАНИЕ ТРЕНИРОВКИ НА ЛЮБОЙ ДЕНЬ
// (используется для «Добавить тренировку» на пт/вс,
//  либо для добавления «Турнир» на нетренировочный день)
// ============================================
export async function createTrainingDay(input: {
    date: string
    trainingGroup?: string   // default 'main'
    status: TrainingStatus
    startTime: string        // 'HH:MM' или 'HH:MM:SS'
    endTime?: string         // если не задано — берём +2 часа
    note?: string
    substituteName?: string
}): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Нужно войти' }

    const group = input.trainingGroup ?? 'main'
    const start = input.startTime.length === 5 ? `${input.startTime}:00` : input.startTime

    // Вычисляем end_time
    let end: string
    if (input.endTime) {
        end = input.endTime.length === 5 ? `${input.endTime}:00` : input.endTime
    } else {
        // +2 часа
        const [h, m] = start.split(':').map(Number)
        const endH = (h + 2) % 24
        end = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
    }

    // Проверяем что записи ещё нет (уникальность date + training_group)
    const { data: existing } = await supabase
        .from('trainings')
        .select('id')
        .eq('date', input.date)
        .eq('training_group', group)
        .maybeSingle()

    if (existing) {
        return {
            success: false,
            error: 'На эту дату уже есть событие. Отредактируй его.',
        }
    }

    const { data: created, error } = await supabase
        .from('trainings')
        .insert({
            date: input.date,
            training_group: group,
            status: input.status,
            start_time: start,
            end_time: end,
            status_note: input.note || null,
            substitute_name: input.substituteName || null,
        })
        .select('id')
        .single()

    if (error || !created) {
        if (error?.code === '42501') {
            return { success: false, error: 'Только тренер может создавать события' }
        }
        console.error('Failed to create training day:', error)
        return { success: false, error: 'Не удалось создать событие' }
    }

    // Автопост в ленте если это турнир (для тренера же)
    if (input.status === 'tournament_trip') {
        const dateStr = new Date(input.date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
        })
        await supabase.from('posts').insert({
            author_id: user.id,
            title: '🏆 Турнир в расписании',
            content: `${dateStr}, начало в ${start.slice(0, 5)}\n${input.note || ''}`.trim(),
            post_type: 'auto',
            is_pinned: true,
            pinned_at: new Date().toISOString(),
            auto_expires_at: computeAutoExpiresAt(input.date),
        })
    }

    revalidatePath('/schedule')
    revalidatePath('/home')
    revalidatePath('/feed')
    return { success: true, data: { id: created.id } }
}

// ============================================
// ГЕНЕРАЦИЯ ТРЕНИРОВОК (по шаблону)
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