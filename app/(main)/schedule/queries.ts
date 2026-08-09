import { createClient } from '@/shared/lib/supabase/server'
import type { Training, Profile } from '@/types'

export type TrainingAttendee = {
    id: string
    status: string
    player: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'>
}

export type TrainingWithMeta = Training & {
    going_count: number
    my_status: string | null
}

export type TrainingDetailed = Training & {
    attendance: TrainingAttendee[]
    going_count: number
    not_going_count: number
    my_status: string | null
}

/**
 * Тренировки за период (для календаря)
 */
export async function getTrainingsInRange(
    startDate: string,
    endDate: string,
    currentUserId: string
): Promise<TrainingWithMeta[]> {
    const supabase = await createClient()

    const { data: trainings, error } = await supabase
        .from('trainings')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

    if (error || !trainings) return []
    if (trainings.length === 0) return []

    const trainingIds = trainings.map((t) => t.id)

    const { data: attendance } = await supabase
        .from('training_attendance')
        .select('training_id, player_id, status')
        .in('training_id', trainingIds)

    return trainings.map((t) => {
        const ta = attendance?.filter((a) => a.training_id === t.id) || []
        return {
            ...t,
            going_count: ta.filter((a) => a.status === 'going').length,
            my_status: ta.find((a) => a.player_id === currentUserId)?.status || null,
        }
    })
}

/**
 * Ближайшая тренировка основной группы (для главной)
 */
export async function getNextTraining(
    currentUserId: string,
    group: string = 'main'
): Promise<TrainingWithMeta | null> {
    const supabase = await createClient()

    // Берём сегодня по московскому времени
    const now = new Date()
    const mskOffset = 3 * 60
    const msk = new Date(now.getTime() + (mskOffset + now.getTimezoneOffset()) * 60000)
    const today = msk.toISOString().split('T')[0]

    const { data: training } = await supabase
        .from('trainings')
        .select('*')
        .gte('date', today)
        .eq('training_group', group)
        .neq('status', 'cancelled')
        .neq('status', 'holiday')
        .order('date', { ascending: true })
        .limit(1)
        .maybeSingle()

    if (!training) return null

    const { data: attendance } = await supabase
        .from('training_attendance')
        .select('player_id, status')
        .eq('training_id', training.id)

    return {
        ...training,
        going_count: attendance?.filter((a) => a.status === 'going').length || 0,
        my_status: attendance?.find((a) => a.player_id === currentUserId)?.status || null,
    }
}

/**
 * Одна тренировка с деталями
 */
export async function getTraining(
    trainingId: string,
    currentUserId: string
): Promise<TrainingDetailed | null> {
    const supabase = await createClient()

    const { data: training, error } = await supabase
        .from('trainings')
        .select('*')
        .eq('id', trainingId)
        .single()

    if (error || !training) return null

    const { data: attendanceData } = await supabase
        .from('training_attendance')
        .select('id, status, player:player_id(id, full_name, avatar_url, role)')
        .eq('training_id', trainingId)

    const attendance = (attendanceData || []) as unknown as TrainingAttendee[]

    return {
        ...training,
        attendance,
        going_count: attendance.filter((a) => a.status === 'going').length,
        not_going_count: attendance.filter((a) => a.status === 'not_going').length,
        my_status: attendance.find((a) => a.player.id === currentUserId)?.status || null,
    }
}