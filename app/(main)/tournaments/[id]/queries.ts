import { cache } from 'react';
import { createClient } from '@/shared/lib/supabase/server';

export type ParticipantPlayerInfo = {
    kind: 'player' | 'guest';
    id: string;
    full_name: string;
    avatar_url?: string | null;
    rating?: number | null;
};

export type ParticipantRecord = {
    id: string;
    category_id: string;
    status: string;
    pair_status: string | null;
    player1: ParticipantPlayerInfo | null;
    player2: ParticipantPlayerInfo | null;
};

export type RatingGroupCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'OPEN';

export type TournamentCategoryFull = {
    id: string;
    category: 'MS' | 'WS' | 'MD' | 'WD' | 'XD';
    rating_group: RatingGroupCode;
    age_group: string | null;
    max_pairs: number | null;
    is_pair_category: boolean;
    bracket_status: string;
    participants: ParticipantRecord[];
    seekers: ParticipantRecord[];
};

export type MyParticipationInCategory = {
    record_id: string;
    pair_status: string | null;
    is_player1: boolean;
    partner_name?: string | null;
};

export type TournamentDetails = {
    id: string;
    title: string;
    tournament_type: 'home' | 'away';
    status: 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed';
    location: string;
    venue: string | null;
    venue_address: string | null;
    organizer: string | null;
    start_date: string;
    end_date: string;
    registration_time: string | null;
    start_time: string | null;
    description: string | null;
    contact_info: string | null;
    awards: string | null;
    registration_deadline: string | null;
    has_entry_fee: boolean;
    entry_fee_amount: number | null;
    entry_fee_note: string | null;
    pdf_url: string | null;
    created_by: string;
    categories: TournamentCategoryFull[];
    my_participation: Record<string, MyParticipationInCategory>;
    /** Заявки, где я указан вторым игроком и ещё не подтвердил пару. */
    my_pending_invites: ParticipantRecord[];
};

export const getTournamentDetails = cache(async (
    tournamentId: string,
    userId?: string
): Promise<TournamentDetails | null> => {
    const supabase = await createClient();

    const [tournamentRes, categoriesRes] = await Promise.all([
        supabase
            .from('tournaments')
            .select(`
                id, title, tournament_type, status, location, venue, venue_address,
                organizer, start_date, end_date, registration_time, start_time,
                description, contact_info, awards, registration_deadline,
                has_entry_fee, entry_fee_amount, entry_fee_note, pdf_url, created_by
            `)
            .eq('id', tournamentId)
            .maybeSingle(),
        supabase
            .from('tournament_categories')
            .select(`
                id, category, age_group, rating_group, max_pairs,
                bracket_status, bracket_generated
            `)
            .eq('tournament_id', tournamentId),
    ]);

    if (tournamentRes.error || !tournamentRes.data) {
        console.error('[getTournamentDetails] Error:', tournamentRes.error);
        return null;
    }

    const tournament = tournamentRes.data;
    const categories = categoriesRes.data ?? [];
    const categoryIds = categories.map((c) => c.id);

    const participantsRes = categoryIds.length
        ? await supabase
            .from('tournament_participants')
            .select(`
                id,
                category_id,
                status,
                pair_status,
                player1:profiles!player1_id(id, full_name, avatar_url, rating_singles, rating_doubles),
                player2:profiles!player2_id(id, full_name, avatar_url, rating_singles, rating_doubles),
                guest1:guests!guest1_id(id, full_name),
                guest2:guests!guest2_id(id, full_name)
            `)
            .in('category_id', categoryIds)
            .neq('status', 'withdrawn')
        : null;

    const rawParticipants = (participantsRes?.data ?? []) as unknown as any[];

    const myParticipation: Record<string, MyParticipationInCategory> = {};
    const myPendingInvites: ParticipantRecord[] = [];

    const participantsByCategory: Record<string, any[]> = {};
    for (const p of rawParticipants) {
        (participantsByCategory[p.category_id] ??= []).push(p);
    }

    const mappedCategories: TournamentCategoryFull[] = categories.map((cat) => {
        const isPair = cat.category === 'MD' || cat.category === 'WD' || cat.category === 'XD';
        const catParticipants = participantsByCategory[cat.id] ?? [];
        // ...дальше тело без изменений...

        const participants: ParticipantRecord[] = [];
        const seekers: ParticipantRecord[] = [];

        catParticipants.forEach((p: any) => {
            const p1: ParticipantPlayerInfo | null = p.player1
                ? {
                    kind: 'player',
                    id: p.player1.id,
                    full_name: p.player1.full_name,
                    avatar_url: p.player1.avatar_url,
                    rating: isPair ? p.player1.rating_doubles : p.player1.rating_singles,
                }
                : p.guest1
                    ? { kind: 'guest', id: p.guest1.id, full_name: p.guest1.full_name }
                    : null;

            const p2: ParticipantPlayerInfo | null = p.player2
                ? {
                    kind: 'player',
                    id: p.player2.id,
                    full_name: p.player2.full_name,
                    avatar_url: p.player2.avatar_url,
                    rating: isPair ? p.player2.rating_doubles : p.player2.rating_singles,
                }
                : p.guest2
                    ? { kind: 'guest', id: p.guest2.id, full_name: p.guest2.full_name }
                    : null;

            const record: ParticipantRecord = {
                id: p.id,
                category_id: p.category_id,
                status: p.status,
                pair_status: p.pair_status,
                player1: p1,
                player2: p2,
            };

            if (userId) {
                if (p1?.kind === 'player' && p1.id === userId) {
                    myParticipation[cat.id] = {
                        record_id: p.id,
                        pair_status: p.pair_status,
                        is_player1: true,
                        partner_name: p2?.full_name,
                    };
                } else if (p2?.kind === 'player' && p2.id === userId) {
                    myParticipation[cat.id] = {
                        record_id: p.id,
                        pair_status: p.pair_status,
                        is_player1: false,
                        partner_name: p1?.full_name,
                    };
                    // Меня позвали в пару, но я ещё не ответил
                    if (p.pair_status === 'pending') {
                        myPendingInvites.push(record);
                    }
                }
            }

            if (isPair && !p2) {
                seekers.push(record);
            } else {
                participants.push(record);
            }
        });

        // Извлечение рейтинг-группы A, B, C, D, E из age_group
        const rawGroup = (cat.rating_group ?? cat.age_group?.replace(/^Группа\s+/i, '') ?? 'C')
            .trim()
            .toUpperCase();
        const validGroups: RatingGroupCode[] = ['A', 'B', 'C', 'D', 'E', 'OPEN'];
        const ratingGroup: RatingGroupCode = validGroups.includes(rawGroup as any) ? (rawGroup as RatingGroupCode) : 'C';

        return {
            id: cat.id,
            category: cat.category as 'MS' | 'WS' | 'MD' | 'WD' | 'XD',
            rating_group: ratingGroup,
            age_group: cat.age_group,
            max_pairs: cat.max_pairs,
            is_pair_category: isPair,
            bracket_status: cat.bracket_status ?? (cat.bracket_generated ? 'ready' : 'pending'),
            participants,
            seekers,
        };
    });

    return {
        id: tournament.id,
        title: tournament.title,
        tournament_type: tournament.tournament_type as 'home' | 'away',
        status: tournament.status as TournamentDetails['status'],
        location: tournament.location,
        venue: tournament.venue,
        venue_address: tournament.venue_address,
        organizer: tournament.organizer,
        start_date: tournament.start_date,
        end_date: tournament.end_date || tournament.start_date,
        registration_time: tournament.registration_time,
        start_time: tournament.start_time,
        description: tournament.description,
        contact_info: tournament.contact_info,
        awards: tournament.awards,
        registration_deadline: tournament.registration_deadline,
        has_entry_fee: Boolean(tournament.has_entry_fee),
        entry_fee_amount: tournament.entry_fee_amount,
        entry_fee_note: tournament.entry_fee_note,
        pdf_url: tournament.pdf_url,
        created_by: tournament.created_by || '',
        categories: mappedCategories,
        my_participation: myParticipation,
        my_pending_invites: myPendingInvites,
    };
});