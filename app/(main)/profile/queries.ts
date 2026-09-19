import 'server-only'
import { createClient } from '@/shared/lib/supabase/server'
import { ACTIVE_RACKET_STATUSES } from '@/shared/lib/repair'
import type { Profile, RepairRacket } from '@/types'
import {cache} from "react";

export type ProfilePayments = {
    tournaments: number
    trips: number
    repair: number
    total: number
}

export type UpcomingTournament = {
    id: string
    title: string
    start_date: string
    end_date: string | null
    tournament_type: string
    location: string | null
    venue: string | null
}

/**
 * Информация о суммах "к оплате" — только для отображения (никаких платежей).
 */
export const getProfilePayments = cache(
    async (userId: string): Promise<ProfilePayments> => {
        const supabase = await createClient()

        // Турниры — join с tournaments.entry_fee_amount
        const { data: tournamentRegs } = await supabase
            .from('tournament_participants')
            .select(
                `
            fee_paid,
            tournament:tournaments!tournament_participants_tournament_id_fkey(
                has_entry_fee, entry_fee_amount
            )
            `
            )
            .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
            .eq('fee_paid', false)

        const tournamentSum = (tournamentRegs ?? []).reduce((s, r: any) => {
            const t = r.tournament
            if (!t?.has_entry_fee) return s
            return s + (t.entry_fee_amount ?? 0)
        }, 0)

        // Поездки
        const { data: trips } = await supabase
            .from('trip_participants')
            .select('amount_due, is_paid')
            .eq('player_id', userId)
            .eq('is_paid', false)

        const tripsSum = (trips ?? []).reduce(
            (s, t: any) => s + (t.amount_due ?? 0),
            0
        )

        // Ремонт
        const { data: rackets } = await supabase
            .from('repair_rackets')
            .select('cost, is_paid, status')
            .eq('owner_id', userId)
            .or(
                `status.in.(${ACTIVE_RACKET_STATUSES.join(',')}),and(status.eq.returned,is_paid.eq.false)`
            )

        const repairSum = (rackets ?? []).reduce(
            (s, r: any) => (r.is_paid ? s : s + (r.cost ?? 0)),
            0
        )

        return {
            tournaments: tournamentSum,
            trips: tripsSum,
            repair: repairSum,
            total: tournamentSum + tripsSum + repairSum,
        }
    }
)

/**
 * Активные ракетки пользователя
 */
export const getUserRackets= cache(
    async (userId: string): Promise<RepairRacket[]> => {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('repair_rackets')
            .select('*')
            .eq('owner_id', userId)
            .or(
                `status.in.(${ACTIVE_RACKET_STATUSES.join(',')}),and(status.eq.returned,is_paid.eq.false)`
            )
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[getUserRackets]', error)
            return []
        }
        return data ?? []
    }
)

/**
 * Ближайшие турниры, в которых пользователь участвует
 */
export const getUserUpcomingTournaments = cache(
    async (userId: string): Promise<UpcomingTournament[]> => {
        const supabase = await createClient()
        const today = new Date().toISOString().slice(0, 10)

        const { data, error } = await supabase
            .from('tournament_participants')
            .select(
                `
            tournament:tournaments!inner!tournament_participants_tournament_id_fkey(
                id, title, start_date, end_date, tournament_type, location, venue
            )
            `
            )
            .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
            .gte('tournaments.start_date', today)
            .order('start_date', { referencedTable: 'tournaments', ascending: true })
            .limit(3)

        if (error) {
            console.error('[getUserUpcomingTournaments]', error.message, error.code)
            return []
        }

        const seen = new Set<string>()
        const result: UpcomingTournament[] = []

        for (const row of (data ?? []) as unknown as { tournament: UpcomingTournament | null }[]) {
            const t = row.tournament
            if (!t || seen.has(t.id)) continue
            seen.add(t.id)
            result.push(t)
        }

        return result
    }
)


/**
 * Вся история ракеток пользователя (для страницы /profile/rackets)
 */
export const getUserRacketsHistory = cache(
    async (userId: string): Promise<RepairRacket[]> => {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('repair_rackets')
            .select('*')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('[getUserRacketsHistory]', error)
            return []
        }
        return data ?? []
    }
)