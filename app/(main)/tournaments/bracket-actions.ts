'use server';

import { createClient } from '@/shared/lib/supabase/server';
import type { ActionResult } from '@/shared/lib/actions/types';
import { revalidatePath } from 'next/cache';
import type { BracketState, Discipline, RatingGroup } from '@/shared/types/bracket';

async function assertCoach() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false as const, error: 'Не авторизован', supabase, user: null };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['coach', 'development'].includes(profile.role)) {
        return { ok: false as const, error: 'Только тренер может управлять сеткой', supabase, user };
    }

    return { ok: true as const, error: null, supabase, user };
}

/**
 * Создание категории турнира → реальный UUID из БД
 */
export async function createTournamentCategoryAction(
    tournamentId: string,
    category: Discipline,
    ratingGroup: RatingGroup,
    maxPairs: number
): Promise<ActionResult<{ id: string }>> {
    try {
        const auth = await assertCoach();
        if (!auth.ok) return { success: false, error: auth.error };

        const { data, error } = await auth.supabase
            .from('tournament_categories')
            .insert({
                tournament_id: tournamentId,
                category,
                rating_group: ratingGroup,
                age_group: `Группа ${ratingGroup}`,
                max_pairs: maxPairs,
                bracket_generated: false,
            })
            .select('id')
            .single();

        if (error || !data) {
            console.error('[Create Category]', error);
            return { success: false, error: error?.message || 'Не удалось создать категорию' };
        }

        revalidatePath(`/tournaments/${tournamentId}`);
        revalidatePath(`/tournaments/${tournamentId}/bracket`);
        return { success: true, data: { id: data.id } };
    } catch (err: any) {
        console.error('[Create Category] Exception:', err);
        return { success: false, error: err?.message || 'Внутренняя ошибка' };
    }
}

/**
 * Удаление категории
 */
export async function deleteTournamentCategoryAction(
    tournamentId: string,
    categoryId: string
): Promise<ActionResult<void>> {
    try {
        const auth = await assertCoach();
        if (!auth.ok) return { success: false, error: auth.error };

        const { error } = await auth.supabase
            .from('tournament_categories')
            .delete()
            .eq('id', categoryId);

        if (error) return { success: false, error: error.message };

        revalidatePath(`/tournaments/${tournamentId}`);
        revalidatePath(`/tournaments/${tournamentId}/bracket`);
        return { success: true, data: undefined };
    } catch (err: any) {
        return { success: false, error: err?.message || 'Внутренняя ошибка' };
    }
}

/**
 * Сохранение сетки категории
 */
export async function saveCategoryBracketAction(
    tournamentId: string,
    categoryId: string,
    bracketState: BracketState
): Promise<ActionResult<void>> {
    try {
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRe.test(categoryId) || !uuidRe.test(tournamentId)) {
            return { success: false, error: 'Некорректный ID турнира' };
        }

        const auth = await assertCoach();
        if (!auth.ok) return { success: false, error: auth.error };
        const supabase = auth.supabase;

        // 1. Удаляем старые матчи категории
        const { error: delErr } = await supabase.from('tournament_matches').delete().eq('category_id', categoryId);
        if (delErr) return { success: false, error: delErr.message };

        // 2. Single Elimination — пишем ТОЛЬКО стартовый раунд для публичного просмотра (остальное восстановит UI из JSONB)
        if (['SE', 'APP12', 'SWISS', 'DOUBLE_ELIM', 'SE_WITH_PLACES'].includes(bracketState.format) && bracketState.startingMatches.length > 0) {
            const rows = bracketState.startingMatches.map((match, idx) => {
                const p1 = match.p1 && match.p1 !== 'BYE' ? match.p1.id : null;
                const p2 = match.p2 && match.p2 !== 'BYE' ? match.p2.id : null;
                const res = bracketState.matchResults?.[match.id];

                return {
                    category_id: categoryId,
                    round: 1,
                    position: idx + 1,
                    participant1_id: p1,
                    participant2_id: p2,
                    match_type: 'main',
                    placeholder_p1: match.p1 === 'BYE' ? 'BYE' : null,
                    placeholder_p2: match.p2 === 'BYE' ? 'BYE' : null,
                    status: res?.winnerId ? 'completed' : 'scheduled',
                    winner_id: res?.winnerId || null,
                    score: res?.scores || [],
                };
            });

            const { error: insErr } = await supabase.from('tournament_matches').insert(rows as any);
            if (insErr) return { success: false, error: insErr.message };
        }

        // 3. СТАТУС КАТЕГОРИИ: ВАЖНО — СОХРАНЯЕМ ВЕСЬ BRACKET_STATE КАК ЕСТЬ
        const { error: catErr } = await supabase
            .from('tournament_categories')
            .update({
                bracket_generated: true,
                bracket_format: bracketState.format === 'SE' ? 'single_elim' : 'round_robin',
                bracket_status: 'ready',
                bracket_settings: bracketState as any, // ← ЭТО ПОЧИНИТ ПУСТУЮ СЕТКУ ПРИ F5
            })
            .eq('id', categoryId);

        if (catErr) return { success: false, error: catErr.message };

        revalidatePath(`/tournaments/${tournamentId}`);
        revalidatePath(`/tournaments/${tournamentId}/bracket`);
        return { success: true, data: undefined };
    } catch (err: any) {
        console.error('[Save Bracket] Exception:', err);
        return { success: false, error: err?.message || 'Внутренняя ошибка' };
    }
}