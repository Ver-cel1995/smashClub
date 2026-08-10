'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/shared/lib/supabase/server'
import { getCurrentUser } from '@/shared/lib/auth'
import type { ActionResult } from '@/shared/lib/actions/types'
import type { TripParticipantStatus, AttendanceStatus } from '@/types'

/**
 * Ответ на выезд (Поеду / Не поеду / Может быть)
 */
export async function setTripAttendance(
    tripId: string,
    status: TripParticipantStatus
): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Не авторизован' }

    const supabase = await createClient()

    // upsert по (trip_id, player_id)
    const { error } = await supabase
        .from('trip_participants')
        .upsert(
            {
                trip_id: tripId,
                player_id: user.userId,
                status,
                responded_at: new Date().toISOString(),
            },
            { onConflict: 'trip_id,player_id' }
        )

    if (error) {
        console.error('[setTripAttendance]', error)
        return { success: false, error: 'Не удалось сохранить ответ' }
    }

    revalidatePath('/home')
    return { success: true }
}

/**
 * Ответ на тренировку (Приду / Не приду)
 */
export async function setTrainingAttendance(
    trainingId: string,
    status: AttendanceStatus
): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Не авторизован' }

    const supabase = await createClient()

    const { error } = await supabase
        .from('training_attendance')
        .upsert(
            {
                training_id: trainingId,
                player_id: user.userId,
                status,
                responded_at: new Date().toISOString(),
            },
            { onConflict: 'training_id,player_id' }
        )

    if (error) {
        console.error('[setTrainingAttendance]', error)
        return { success: false, error: 'Не удалось сохранить ответ' }
    }

    revalidatePath('/home')
    return { success: true }
}

/**
 * Напоминание об оплате ремонта (заглушка под push)
 */
export async function remindRepairPayment(
    playerId: string
): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Не авторизован' }

    const isCoach = user.profile.role === 'coach'
    if (!isCoach) return { success: false, error: 'Только для тренера' }

    // TODO: push через notifications table + web-push
    // Пока просто пишем в notifications
    const supabase = await createClient()

    const { error } = await supabase.from('notifications').insert({
        user_id: playerId,
        type: 'repair_payment_reminder',
        title: 'Напоминание об оплате',
        body: 'Пожалуйста, оплатите ремонт ракетки',
    })

    if (error) {
        console.error('[remindRepairPayment]', error)
        return { success: false, error: 'Не удалось отправить напоминание' }
    }

    return { success: true }
}