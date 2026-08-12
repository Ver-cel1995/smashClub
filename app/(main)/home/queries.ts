import 'server-only'
import { cache } from 'react'
import { createClient } from '@/shared/lib/supabase/server'
import { ACTIVE_RACKET_STATUSES } from '@/shared/lib/repair'
import type {
    Post,
    Profile,
    Training,
    TrainingWithAttendance,
    TripWithParticipants,
    RepairSummaryPlayer,
    RepairSummaryCoach,
} from '@/types'

export const getActiveCoachAnnouncement = cache(
    async (): Promise<
        (Post & { author: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> }) | null
    > => {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                author:profiles!posts_author_id_fkey(id, full_name, avatar_url)
            `)
            .eq('post_type', 'auto')
            .eq('is_pinned', true)
            .gt('auto_expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) {
            console.error('[getActiveCoachAnnouncement]', error)
            return null
        }
        return data as any
    }
)

export const getUpcomingAffectedTraining = cache(
    async (): Promise<Training | null> => {
        const supabase = await createClient()
        const today = new Date().toISOString().split('T')[0]
        const in3days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]

        const { data, error } = await supabase
            .from('trainings')
            .select('*')
            .gte('date', today)
            .lte('date', in3days)
            .in('status', ['cancelled', 'holiday', 'no_coach_open', 'substitute', 'tournament_trip'])
            .order('date', { ascending: true })
            .order('start_time', { ascending: true })
            .limit(1)
            .maybeSingle()

        if (error) {
            console.error('[getUpcomingAffectedTraining]', error)
            return null
        }
        return data
    }
)

export const getNextTrainingWithAttendance = cache(
    async (userId: string): Promise<TrainingWithAttendance | null> => {
        const supabase = await createClient()
        const today = new Date().toISOString().split('T')[0]

        const { data: training, error } = await supabase
            .from('trainings')
            .select(`
                *,
                attendance:training_attendance(
                    *,
                    profile:profiles!training_attendance_player_id_fkey(id, full_name, avatar_url)
                )
            `)
            .gte('date', today)
            .not('status', 'in', '(cancelled,holiday)')
            .order('date', { ascending: true })
            .order('start_time', { ascending: true })
            .limit(1)
            .maybeSingle()

        if (error || !training) {
            if (error) console.error('[getNextTrainingWithAttendance]', error)
            return null
        }

        const attendance = (training.attendance ?? []) as any[]
        const going = attendance.filter((a) => a.status === 'going')
        const notGoing = attendance.filter((a) => a.status === 'not_going')
        const myAttendance = attendance.find((a) => a.player_id === userId)

        return {
            ...training,
            attendance,
            my_status: myAttendance?.status ?? null,
            going_count: going.length,
            not_going_count: notGoing.length,
        } as TrainingWithAttendance
    }
)

export const getNextTripWithParticipants = cache(
    async (userId: string): Promise<TripWithParticipants | null> => {
        const supabase = await createClient()
        const today = new Date().toISOString().split('T')[0]

        const { data: trip, error } = await supabase
            .from('trips')
            .select(`
                *,
                participants:trip_participants(
                    *,
                    profile:profiles!trip_participants_player_id_fkey(id, full_name, avatar_url)
                )
            `)
            .or(`end_date.gte.${today},and(end_date.is.null,start_date.gte.${today})`)
            .order('start_date', { ascending: true })
            .limit(1)
            .maybeSingle()

        if (error || !trip) {
            if (error) console.error('[getNextTripWithParticipants]', error)
            return null
        }

        const participants = (trip.participants ?? []) as any[]
        const myParticipant = participants.find((p) => p.player_id === userId)

        return {
            ...trip,
            participants,
            my_status: myParticipant?.status ?? null,
        } as TripWithParticipants
    }
)

export const getRepairForPlayer = cache(
    async (userId: string): Promise<RepairSummaryPlayer | null> => {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('repair_rackets')
            .select(`
                *,
                batch:repair_batches(id, actual_send_date, expected_return_date, planned_send_date)
            `)
            .eq('owner_id', userId)
            .or(
                `status.in.(${ACTIVE_RACKET_STATUSES.join(',')}),and(status.eq.returned,is_paid.eq.false)`
            )
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[getRepairForPlayer]', error)
            return null
        }
        if (!data || data.length === 0) return null

        const total_cost = data.reduce((sum, r: any) => sum + (r.cost ?? 0), 0)
        return {
            rackets: data as any,
            total_cost,
        }
    }
)

export const getRepairForCoach = cache(
    async (): Promise<RepairSummaryCoach | null> => {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('repair_rackets')
            .select(`
                *,
                owner:profiles!repair_rackets_owner_id_fkey(id, full_name, avatar_url)
            `)
            .or(
                `status.in.(${ACTIVE_RACKET_STATUSES.join(',')}),and(status.eq.returned,is_paid.eq.false)`
            )

        if (error) {
            console.error('[getRepairForCoach]', error)
            return null
        }
        if (!data || data.length === 0) return null

        const byPlayer = new Map<string, {
            profile: any
            rackets: any[]
            total_cost: number
            unpaid_cost: number
        }>()

        for (const r of data as any[]) {
            const key = r.owner_id
            if (!byPlayer.has(key)) {
                byPlayer.set(key, {
                    profile: r.owner,
                    rackets: [],
                    total_cost: 0,
                    unpaid_cost: 0,
                })
            }
            const entry = byPlayer.get(key)!
            entry.rackets.push(r)
            const c = r.cost ?? 0
            entry.total_cost += c
            if (!r.is_paid) entry.unpaid_cost += c
        }

        const players = Array.from(byPlayer.values())
        return {
            players_count: players.length,
            rackets_count: data.length,
            total_cost: players.reduce((s, p) => s + p.total_cost, 0),
            unpaid_cost: players.reduce((s, p) => s + p.unpaid_cost, 0),
            players,
        }
    }
)

export const getHomeFeedPost = cache(
    async (): Promise<
        (Post & { author: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> }) | null
    > => {
        const supabase = await createClient()
        const { data, error } = await supabase

            .from('posts')
            .select(`
            *,
            author:profiles!posts_author_id_fkey(id, full_name, avatar_url)
        `)
            .in('post_type', ['text', 'media'])
            .is('trip_id', null)
            .is('tournament_id', null)
            .order('is_pinned', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) {
            console.error('[getHomeFeedPost]', error)
            return null
        }
        return (data as any) ?? null
    }
)


// Ближайший турнир (для блока на главной)

export type NextTournamentPayload = {
    id: string
    title: string
    tournament_type: 'home' | 'away'
    city: string  // из location, берём до первой запятой
    location: string  // полный
    start_date: string
    end_date: string | null
    registration_deadline: string | null
    has_entry_fee: boolean
    entry_fee_amount: number | null
    // Статус игрока в этом турнире
    my_participation: {
        // Я записан хоть в одну категорию (как player1 или подтверждённый player2)
        is_participating: boolean
        // Есть ли неподтверждённые приглашения ко мне (как player2, pair_status=pending)
        has_pending_invite: boolean
        // Есть ли записи где я "ищу пару" (player1 в парной без player2/guest2)
        is_looking_for_partner: boolean
    }
    // Идёт ли турнир прямо сейчас (сегодня попадает в [start_date, end_date])
    is_ongoing: boolean
}

export const getNextTournament = cache(
    async (userId: string): Promise<NextTournamentPayload | null> => {
        const supabase = await createClient()
        const today = new Date().toISOString().slice(0, 10)

        // Берём ближайший турнир, у которого end_date (или start_date) >= сегодня
        const { data: tournaments, error } = await supabase
            .from('tournaments')
            .select(
                'id, title, tournament_type, location, start_date, end_date, registration_deadline, has_entry_fee, entry_fee_amount'
            )
            .or(`end_date.gte.${today},and(end_date.is.null,start_date.gte.${today})`)
            .order('start_date', { ascending: true })
            .limit(1)

        if (error) {
            console.error('Failed to load next tournament:', error)
            return null
        }

        const t = tournaments?.[0]
        if (!t) return null

        // Проверяем участие текущего пользователя
        const { data: myRecords } = await supabase
            .from('tournament_participants')
            .select('player1_id, player2_id, guest2_id, pair_status')
            .eq('tournament_id', t.id)
            .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)

        let isParticipating = false
        let hasPendingInvite = false
        let isLookingForPartner = false

        for (const record of myRecords ?? []) {
            const iAmPlayer1 = record.player1_id === userId
            const iAmPlayer2 = record.player2_id === userId

            if (iAmPlayer1) {
                // Я сам записался — всегда «участвую»
                isParticipating = true
                // Если пара, но партнёра нет — «ищу партнёра»
                if (!record.player2_id && !record.guest2_id) {
                    isLookingForPartner = true
                }
            }

            if (iAmPlayer2) {
                if (record.pair_status === 'confirmed') {
                    isParticipating = true
                } else if (record.pair_status === 'pending') {
                    hasPendingInvite = true
                }
                // declined — просто игнорируем, будто не приглашали
            }
        }

        // Определяем "идёт сейчас"
        const startDate = t.start_date
        const endDate = t.end_date ?? t.start_date
        const isOngoing = today >= startDate && today <= endDate

        // Город — первая часть location до запятой
        const city = (t.location ?? '').split(',')[0].trim()

        return {
            id: t.id,
            title: t.title,
            tournament_type: t.tournament_type as 'home' | 'away',
            city,
            location: t.location ?? '',
            start_date: t.start_date,
            end_date: t.end_date,
            registration_deadline: t.registration_deadline,
            has_entry_fee: t.has_entry_fee ?? false,
            entry_fee_amount: t.entry_fee_amount,
            my_participation: {
                is_participating: isParticipating,
                has_pending_invite: hasPendingInvite,
                is_looking_for_partner: isLookingForPartner,
            },
            is_ongoing: isOngoing,
        }
    }
)