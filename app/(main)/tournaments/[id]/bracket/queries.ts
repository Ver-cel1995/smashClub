import { cache } from 'react';
import { createClient } from '@/shared/lib/supabase/server';

export const getTournamentBracketData = cache(async (tournamentId: string) => {
    const supabase = await createClient();

    const [tournamentRes, categoriesRes] = await Promise.all([
        supabase
            .from('tournaments')
            .select('id, title, created_by, status')
            .eq('id', tournamentId)
            .maybeSingle(),
        supabase
            .from('tournament_categories')
            .select('id, category, age_group, max_pairs, bracket_format, bracket_generated, participants_count')
            .eq('tournament_id', tournamentId),
    ]);

    const categories = categoriesRes.data ?? [];
    const categoryIds = categories.map((c) => c.id);

    if (categoryIds.length === 0) {
        return {
            tournament: tournamentRes.data,
            categories,
            participants: [],
            matches: [],
        };
    }

    const [participantsRes, matchesRes] = await Promise.all([
        supabase
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
            .neq('status', 'withdrawn'),
        supabase
            .from('tournament_matches')
            .select(`
                id, category_id, round, position,
                participant1_id, participant2_id, winner_id, score, status,
                match_type, court, next_match_id, placeholder_p1, placeholder_p2
            `)
            .in('category_id', categoryIds)
            .order('round', { ascending: true })
            .order('position', { ascending: true }),
    ]);

    return {
        tournament: tournamentRes.data,
        categories,
        participants: participantsRes.data ?? [],
        matches: matchesRes.data ?? [],
    };
});