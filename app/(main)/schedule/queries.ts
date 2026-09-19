import {createClient} from '@/shared/lib/supabase/server'
import type {Profile, Training} from '@/types'
import {cache} from 'react'
import {unstable_cache} from "next/cache";

export type TrainingAttendee = {
    id: string
    status: string
    player: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'>
}

export type TrainingWithMeta = Training & {
    going_count: number
    my_status: string | null
    /** Виртуальная запись из tournaments (не из trainings) */
    is_virtual_tournament?: boolean
    virtual_tournament_id?: string
    virtual_tournament_title?: string
}

export type TrainingDetailed = Training & {
    attendance: TrainingAttendee[]
    going_count: number
    not_going_count: number
    my_status: string | null
}

export type ClubPlayer = {
    id: string
    full_name: string
    avatar_url: string | null
    role: string
}

/**
 * Тренировки за период (для календаря).
 * Оптимизировано: 1 JOIN-запрос + параллельный запрос турниров.
 */
export const getTrainingsInRange = cache(async (
    startDate: string,
    endDate: string,
    currentUserId?: string | null
): Promise<TrainingWithMeta[]> => {
    const supabase = await createClient()

    // Загружаем тренировки вместе с посещаемостью и домашние турниры ПАРАЛЛЕЛЬНО
    const [trainingsRes, tournamentsRes] = await Promise.all([
        supabase
            .from('trainings')
            .select('*, training_attendance(player_id, status)')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true }),
        supabase
            .from('tournaments')
            .select('id, title, tournament_type, start_date, end_date')
            .eq('tournament_type', 'home')
    ])

    const trainingsList = trainingsRes.data || []
    const tournamentsList = tournamentsRes.data || []

    // Мапа дат где есть реальная тренировка
    const realTrainingDates = new Set(trainingsList.map((t) => t.date.slice(0, 10)))

    // Фильтруем домашние турниры в JS (без лагающих SQL .or() фильтров)
    const virtualTrainings: TrainingWithMeta[] = []

    for (const tour of tournamentsList) {
        const tourStart = tour.start_date.slice(0, 10)
        const tourEnd = tour.end_date ? tour.end_date.slice(0, 10) : tourStart

        if (tourEnd < startDate || tourStart > endDate) continue

        const dates = expandDateRange(tourStart, tourEnd)
        for (const date of dates) {
            if (date < startDate || date > endDate) continue
            if (realTrainingDates.has(date)) continue

            virtualTrainings.push({
                id: `virtual-${tour.id}-${date}`,
                date,
                start_time: '10:00:00',
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

    // Преобразуем реальные тренировки
    const realWithMeta: TrainingWithMeta[] = trainingsList.map((t: any) => {
        const ta = (t.training_attendance || []) as Array<{ player_id: string; status: string }>
        return {
            id: t.id,
            date: t.date,
            start_time: t.start_time,
            end_time: t.end_time,
            status: t.status,
            status_note: t.status_note,
            substitute_name: t.substitute_name,
            training_group: t.training_group,
            auto_post_id: t.auto_post_id,
            created_at: t.created_at,
            updated_at: t.updated_at,
            going_count: ta.filter((a) => a.status === 'going').length,
            my_status: currentUserId ? ta.find((a) => a.player_id === currentUserId)?.status || null : null,
        }
    })

    return [...realWithMeta, ...virtualTrainings].sort((a, b) =>
        a.date.localeCompare(b.date)
    )
})

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

export const getNextTraining = cache(async (
    currentUserId: string,
    group: string = 'main'
): Promise<TrainingWithMeta | null> => {
    const supabase = await createClient()

    const now = new Date()
    const mskOffset = 3 * 60
    const msk = new Date(now.getTime() + (mskOffset + now.getTimezoneOffset()) * 60000)
    const today = msk.toISOString().split('T')[0]

    const { data: training } = await supabase
        .from('trainings')
        .select('*, training_attendance(player_id, status)')
        .gte('date', today)
        .eq('training_group', group)
        .neq('status', 'cancelled')
        .neq('status', 'holiday')
        .order('date', { ascending: true })
        .limit(1)
        .maybeSingle()

    if (!training) return null

    const ta = (training.training_attendance || []) as Array<{ player_id: string; status: string }>

    return {
        ...training,
        going_count: ta.filter((a) => a.status === 'going').length,
        my_status: ta.find((a) => a.player_id === currentUserId)?.status || null,
    }
})

export const getTraining = cache(async (
    trainingId: string,
    currentUserId: string
): Promise<TrainingDetailed | null> => {
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
})

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

export const getTrainingComments = cache(async (trainingId: string): Promise<TrainingComment[]> => {
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
})

export const getAllClubPlayers = unstable_cache(
    async (): Promise<ClubPlayer[]> => {
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
    },
    ['club-players'],
    { revalidate: 600, tags: ['profiles'] }
)