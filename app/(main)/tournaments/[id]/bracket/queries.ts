import { cache } from 'react';
import { createClient } from '@/shared/lib/supabase/server';

export const getTournamentBracketData = cache(async (tournamentId: string) => {
    const supabase = await createClient();

    // 1. Данные турнира (для проверки владельца)
    const { data: tournament } = await supabase
        .from('tournaments')
        .select('id, title, created_by, status')
        .eq('id', tournamentId)
        .maybeSingle();

    // 2. Категории
    const { data: categories } = await supabase
        .from('tournament_categories')
        .select('id, category, age_group, max_pairs, bracket_format, bracket_generated, participants_count')
        .eq('tournament_id', tournamentId);

    const categoryIds = (categories || []).map((c) => c.id);

    // 3. Участники
    const { data: participants } = categoryIds.length
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
        : { data: [] };

    // 4. Матчи
    const { data: matches } = categoryIds.length
        ? await supabase
            .from('tournament_matches')
            .select('*')
            .in('category_id', categoryIds)
            .order('round', { ascending: true })
            .order('position', { ascending: true })
        : { data: [] };

    return {
        tournament,
        categories: categories || [],
        participants: participants || [],
        matches: matches || [],
    };
});