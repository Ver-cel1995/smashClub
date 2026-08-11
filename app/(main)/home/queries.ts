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