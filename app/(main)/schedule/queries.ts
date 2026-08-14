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
    /** Виртуальная запись из tournaments (не из trainings). Не редактируется через EditDayDialog. */
    is_virtual_tournament?: boolean
    /** ID турнира — если это виртуальная запись */
    virtual_tournament_id?: string
    /** Название турнира — для отображения */
    virtual_tournament_title?: string
}

export type TrainingDetailed = Training & {
    attendance: TrainingAttendee[]
    going_count: number
    not_going_count: number
    my_status: string | null
}

/**
 * Тренировки за период (для календаря).
 * Дополнительно добавляет "виртуальные" турнирные дни из tournaments,
 * если тип турнира 'home' и на эту дату НЕТ реальной тренировки.
 */
export async function getTrainingsInRange(
    startDate: string,
    endDate: string,
    currentUserId: string
): Promise<TrainingWithMeta[]> {
    const supabase = await createClient()

    // 1. Обычные тренировки из БД
    const { data: trainings } = await supabase
        .from('trainings')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

    const trainingsList = trainings || []
    const trainingIds = trainingsList.map((t) => t.id)

    // 2. Attendance для этих тренировок
    const attendance = trainingIds.length > 0
        ? (await supabase
        .from('training_attendance')
        .select('training_id, player_id, status')
        .in('training_id', trainingIds)).data || []
        : []

    // 3. Домашние турниры в диапазоне
    // Логика: если турнир 'home' и на дату турнира нет реальной тренировки —
    // добавляем "виртуальную" запись
    const { data: tournaments } = await supabase
        .from('tournaments')
        .select('id, title, tournament_type, start_date, end_date')
        .eq('tournament_type', 'home')
        .lte('start_date', endDate)
        .or(`end_date.gte.${startDate},and(end_date.is.null,start_date.gte.${startDate})`)

    const virtualTrainings: TrainingWithMeta[] = []

    if (tournaments) {
        // Мапа дат где есть реальная тренировка
        const realTrainingDates = new Set(trainingsList.map((t) => t.date.slice(0, 10)))

        for (const tour of tournaments) {
            // Собираем все даты турнира (start_date..end_date)
            const dates = expandDateRange(tour.start_date, tour.end_date ?? tour.start_date)
            for (const date of dates) {
                if (date < startDate || date > endDate) continue
                if (realTrainingDates.has(date)) continue  // уже есть реальная тренировка

                virtualTrainings.push({
                    id: `virtual-${tour.id}-${date}`,
                    date,
                    start_time: '10:00:00',   // дефолтное время — реальное хранится в description
                    end_time: '18:00:00',
                    status: 'tournament_trip',
                    status_note: `Турнир: ${tour.title}`,
                    substitute_name: null,
                    training_group: 'main',
                    auto_post_id: null,
                    created_at: null,
                    updated_at: null,
                    going_count: 0,
                    my_status: null,
                    is_virtual_tournament: true,
                    virtual_tournament_id: tour.id,
                    virtual_tournament_title: tour.title,
                })
            }
        }
    }

    // 4. Реальные тренировки с attendance
    const realWithMeta: TrainingWithMeta[] = trainingsList.map((t) => {
        const ta = attendance.filter((a) => a.training_id === t.id)
        return {
            ...t,
            going_count: ta.filter((a) => a.status === 'going').length,
            my_status: ta.find((a) => a.player_id === currentUserId)?.status || null,
        }
    })

    // 5. Объединяем и сортируем по дате
    return [...realWithMeta, ...virtualTrainings].sort((a, b) =>
        a.date.localeCompare(b.date)
    )
}

/**
 * Разворачивает диапазон дат в массив ['2026-01-01', '2026-01-02', ...]
 */
function expandDateRange(start: string, end: string): string[] {
    const startD = new Date(start + 'T00:00:00Z')
    const endD = new Date(end + 'T00:00:00Z')
    const result: string[] = []
    const cursor = new Date(startD)
    while (cursor <= endD) {
        result.push(cursor.toISOString().slice(0, 10))
        cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    return result
}

/**
 * Ближайшая тренировка основной группы (для главной)
 */
export async function getNextTraining(
    currentUserId: string,
    group: string = 'main'
): Promise<TrainingWithMeta | null> {
    const supabase = await createClient()

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





// Комментарии к тренировке
export type TrainingComment = {
    id: string
    training_id: string
    author_id: string
    content: string
    parent_comment_id: string | null
    created_at: string
    author: {
        id: string
        full_name: string
        avatar_url: string | null
        role: string
    } | null
}

export async function getTrainingComments(trainingId: string): Promise<TrainingComment[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('training_comments')
        .select(`
            id, training_id, author_id, content, parent_comment_id, created_at,
            author:profiles!training_comments_author_id_fkey(id, full_name, avatar_url, role)
        `)
        .eq('training_id', trainingId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('[getTrainingComments]', error)
        return []
    }

    return (data ?? []) as unknown as TrainingComment[]
}

/**
 * Все игроки клуба + тренер (для списка "не ответили").
 * Возвращает всех авторизованных пользователей за исключением тренера.
 */
export async function getAllClubPlayers(): Promise<Array<{
    id: string
    full_name: string
    avatar_url: string | null
    role: string
}>> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .order('full_name', { ascending: true })

    if (error) {
        console.error('[getAllClubPlayers]', error)
        return []
    }

    return data ?? []
}