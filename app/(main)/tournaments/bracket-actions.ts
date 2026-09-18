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
        // Валидация UUID
        const uuidRe =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRe.test(categoryId)) {
            return {
                success: false,
                error: 'Некорректный ID категории. Создайте категорию заново через «Добавить категорию».',
            };
        }
        if (!uuidRe.test(tournamentId)) {
            return { success: false, error: 'Некорректный ID турнира' };
        }

        const auth = await assertCoach();
        if (!auth.ok) return { success: false, error: auth.error };

        const supabase = auth.supabase;

        // 1. Удаляем старые матчи категории
        const { error: delErr } = await supabase
            .from('tournament_matches')
            .delete()
            .eq('category_id', categoryId);

        if (delErr) {
            console.error('[Save Bracket] delete:', delErr);
            return { success: false, error: delErr.message };
        }

        // 2. Single Elimination — пишем стартовый раунд
        if (bracketState.format === 'SE' && bracketState.startingMatches.length > 0) {
            // participant1_id / participant2_id — это FK на tournament_participants.id
            // В конструкторе мы кладём profile id. Если слот = participant record id — ок.
            // Пока сохраняем как есть; позже маппим profile → participant.
            const rows = bracketState.startingMatches.map((match, idx) => {
                const p1 =
                    match.p1 && match.p1 !== 'BYE' ? match.p1.id : null;
                const p2 =
                    match.p2 && match.p2 !== 'BYE' ? match.p2.id : null;

                return {
                    category_id: categoryId,
                    // ВАЖНО: в схеме колонка называется round, не round_number
                    round: 1,
                    position: idx + 1,
                    participant1_id: p1,
                    participant2_id: p2,
                    match_type: 'main',
                    placeholder_p1: match.p1 === 'BYE' ? 'BYE' : null,
                    placeholder_p2: match.p2 === 'BYE' ? 'BYE' : null,
                    status: 'scheduled' as const,
                    score: [] as unknown as Record<string, never>,
                };
            });

            const { error: insErr } = await supabase
                .from('tournament_matches')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .insert(rows as any);

            if (insErr) {
                console.error('[Save Bracket] insert:', insErr);
                return { success: false, error: insErr.message };
            }
        }

        // 3. Статус категории
        const { error: catErr } = await supabase
            .from('tournament_categories')
            .update({
                bracket_generated: true,
                bracket_format: bracketState.format === 'SE' ? 'single_elim' : 'round_robin',
                bracket_status: 'ready',
                bracket_settings: {
                    format: bracketState.format,
                    seedingType: bracketState.seedingType ?? 'SNAKE',
                    updated_at: new Date().toISOString(),
                },
            })
            .eq('id', categoryId);

        if (catErr) {
            console.error('[Save Bracket] category update:', catErr);
            return { success: false, error: catErr.message };
        }

        revalidatePath(`/tournaments/${tournamentId}`);
        revalidatePath(`/tournaments/${tournamentId}/bracket`);
        return { success: true, data: undefined };
    } catch (err: any) {
        console.error('[Save Bracket] Exception:', err);
        return { success: false, error: err?.message || 'Внутренняя ошибка' };
    }
}