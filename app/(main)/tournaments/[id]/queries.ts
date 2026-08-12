import { cache } from 'react'
import { createClient } from '@/shared/lib/supabase/server'
import type { Database } from '@/types/database'

type ParticipantRow = Database['public']['Tables']['tournament_participants']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type GuestRow = Database['public']['Tables']['guests']['Row']

export type ParticipantPlayerInfo = {
    kind: 'player'
    id: string
    full_name: string
    avatar_url: string | null
} | {
    kind: 'guest'
    id: string
    full_name: string
}

export type ParticipantRecord = {
    id: string
    category_id: string
    player1: ParticipantPlayerInfo | null
    player2: ParticipantPlayerInfo | null
    pair_status: 'pending' | 'confirmed' | 'declined' | null
    registered_by: string
    is_looking_for_partner: boolean  // computed: парная категория, но player2/guest2 не заполнены
}

export type TournamentCategoryFull = {
    id: string
    category: 'MS' | 'WS' | 'MD' | 'WD' | 'XD'
    age_group: string | null
    is_pair_category: boolean  // computed: MD/WD/XD
    participants: ParticipantRecord[]
    seekers: ParticipantRecord[]  // те кто 'ищет партнёра' в этой категории
}

export type MyParticipationInCategory = {
    category_id: string
    // Все мои записи в этой категории (может быть несколько если сложный сценарий)
    records: Array<{
        record_id: string
        role: 'player1' | 'player2'
        pair_status: 'pending' | 'confirmed' | 'declined' | null
        partner: ParticipantPlayerInfo | null
    }>
}

export type TournamentFullData = {
    tournament: Database['public']['Tables']['tournaments']['Row']
    categories: TournamentCategoryFull[]
    // Что уже есть у текущего пользователя (по категориям)
    my_participation: Record<string, MyParticipationInCategory>
    // Пары где я player2 и pair_status=pending — «приглашения ко мне»
    my_pending_invites: ParticipantRecord[]
}

// status

const PAIR_CATEGORIES: ReadonlySet<string> = new Set(['MD', 'WD', 'XD'])

function buildPlayerInfo(
    profile: Pick<ProfileRow, 'id' | 'full_name' | 'avatar_url'> | null,
    guest: Pick<GuestRow, 'id' | 'full_name'> | null
): ParticipantPlayerInfo | null {
    if (profile) {
        return {
            kind: 'player',
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
        }
    }
    if (guest) {
        return {
            kind: 'guest',
            id: guest.id,
            full_name: guest.full_name,
        }
    }
    return null
}

// ==== Основная query ====

export const getTournamentFullData = cache(
    async (tournamentId: string, currentUserId: string): Promise<TournamentFullData | null> => {
        const supabase = await createClient()

        // 1. Сам турнир
        const { data: tournament, error: tournamentError } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', tournamentId)
            .single()

        if (tournamentError || !tournament) {
            return null
        }

        // 2. Категории
        const { data: categoriesRaw } = await supabase
            .from('tournament_categories')
            .select('*')
            .eq('tournament_id', tournamentId)
            .order('category')

        const categoriesList = categoriesRaw ?? []

        // 3. Все участники этого турнира + связанные профили/гости
        const { data: participantsRaw } = await supabase
            .from('tournament_participants')
            .select(
                `
                id,
                category_id,
                player1_id,
                player2_id,
                guest1_id,
                guest2_id,
                pair_status,
                registered_by,
                player1:profiles!tournament_participants_player1_id_fkey(id, full_name, avatar_url),
                player2:profiles!tournament_participants_player2_id_fkey(id, full_name, avatar_url),
                guest1:guests!tournament_participants_guest1_id_fkey(id, full_name),
                guest2:guests!tournament_participants_guest2_id_fkey(id, full_name)
                `
            )
            .eq('tournament_id', tournamentId)

        const participants = (participantsRaw ?? []) as unknown as Array<
            ParticipantRow & {
            player1: Pick<ProfileRow, 'id' | 'full_name' | 'avatar_url'> | null
            player2: Pick<ProfileRow, 'id' | 'full_name' | 'avatar_url'> | null
            guest1: Pick<GuestRow, 'id' | 'full_name'> | null
            guest2: Pick<GuestRow, 'id' | 'full_name'> | null
        }
        >

        // 4. Сборка структуры категорий
        const categories: TournamentCategoryFull[] = categoriesList.map((c) => {
            const isPair = PAIR_CATEGORIES.has(c.category)

            const records: ParticipantRecord[] = participants
                .filter((p) => p.category_id === c.id)
                .map((p) => {
                    const player1 = buildPlayerInfo(p.player1, p.guest1)
                    const player2 = buildPlayerInfo(p.player2, p.guest2)
                    const isSeeker =
                        isPair &&
                        player1 !== null &&
                        player2 === null &&
                        p.pair_status !== 'declined'

                    return {
                        id: p.id,
                        category_id: p.category_id,
                        player1,
                        player2,
                        pair_status: p.pair_status as ParticipantRecord['pair_status'],
                        registered_by: p.registered_by ?? '',
                        is_looking_for_partner: isSeeker,
                    }
                })

            return {
                id: c.id,
                category: c.category,
                age_group: c.age_group ?? null,
                is_pair_category: isPair,
                participants: records.filter((r) => !r.is_looking_for_partner),
                seekers: records.filter((r) => r.is_looking_for_partner),
            }
        })

        // 5. Мои записи (по категориям)
        const myParticipation: Record<string, MyParticipationInCategory> = {}
        const myPendingInvites: ParticipantRecord[] = []

        for (const category of categories) {
            const myRecordsInCategory: MyParticipationInCategory['records'] = []
            const allRecords = [...category.participants, ...category.seekers]

            for (const rec of allRecords) {
                const iAmPlayer1 = rec.player1?.kind === 'player' && rec.player1.id === currentUserId
                const iAmPlayer2 = rec.player2?.kind === 'player' && rec.player2.id === currentUserId

                if (iAmPlayer1) {
                    myRecordsInCategory.push({
                        record_id: rec.id,
                        role: 'player1',
                        pair_status: rec.pair_status,
                        partner: rec.player2,
                    })
                } else if (iAmPlayer2) {
                    myRecordsInCategory.push({
                        record_id: rec.id,
                        role: 'player2',
                        pair_status: rec.pair_status,
                        partner: rec.player1,
                    })
                    if (rec.pair_status === 'pending') {
                        myPendingInvites.push(rec)
                    }
                }
            }

            if (myRecordsInCategory.length > 0) {
                myParticipation[category.id] = {
                    category_id: category.id,
                    records: myRecordsInCategory,
                }
            }
        }

        return {
            tournament,
            categories,
            my_participation: myParticipation,
            my_pending_invites: myPendingInvites,
        }
    }
)