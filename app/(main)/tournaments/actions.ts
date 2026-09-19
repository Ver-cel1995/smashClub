'use server';

import {createClient} from '@/shared/lib/supabase/server';
import {ActionResult} from '@/shared/lib/actions/types';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {mapPgError} from '@/shared/lib/actions/pg-errors';
import {getCurrentUser} from "@/shared/lib/auth";

// Гибкая дата: пустая строка "" превращается в null
const optionalDateSchema = z
    .string()
    .nullable()
    .optional()
    .transform((val) => (!val || val.trim() === '' ? null : val))
    .refine((val) => val === null || /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: 'Укажите дату в формате ГГГГ-ММ-ДД',
    });

const RATING_GROUPS = ['A', 'B', 'C', 'D', 'E', 'OPEN'] as const;

const createTournamentSchema = z
    .object({
        title: z.string().min(3, 'Название минимум 3 символа').max(200),
        tournament_type: z.enum(['home', 'away']).optional().default('away'),
        organizer: z.string().max(200).nullable().optional(),
        city: z.string().min(2, 'Укажи город').max(200),
        venue_name: z.string().max(200).nullable().optional(),
        venue_address: z.string().max(300).nullable().optional(),
        start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Укажите дату начала'),
        end_date: optionalDateSchema,
        registration_time: z.string().max(50).nullable().optional(),
        start_time: z.string().max(50).nullable().optional(),
        registration_deadline: optionalDateSchema,
        entry_fee: z.number().int().min(0).max(1000000).nullable().optional(),
        entry_fee_note: z.string().max(500).nullable().optional(),
        description: z.string().max(2000).nullable().optional(),
        contact_info: z.string().max(300).nullable().optional(),
        pdf_url: z.string().url().nullable().optional(),
        pdf_storage_path: z.string().nullable().optional(),
        awards: z.string().max(1000).nullable().optional(),
        categories: z
            .array(
                z.object({
                    category: z.enum(['MS', 'WS', 'MD', 'WD', 'XD']),
                    rating_group: z.enum(RATING_GROUPS),
                    max_pairs: z.number().int().min(2).max(256).nullable().optional(),
                })
            )
            .min(1, 'Добавь хотя бы одну категорию'),
    })
    .refine(
        (data) => {
            if (data.registration_deadline && data.start_date) {
                return data.registration_deadline <= data.start_date;
            }
            return true;
        },
        {
            message: 'Дедлайн регистрации не может быть позже даты начала турнира',
            path: ['registration_deadline'],
        }
    );

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

function extractFieldErrors(error: unknown): Record<string, string> {
    if (
        typeof error === 'object' &&
        error !== null &&
        'issues' in error &&
        Array.isArray((error as { issues: unknown }).issues)
    ) {
        const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
        return issues.reduce((acc, issue) => {
            const field = issue.path[0]?.toString() || '_';
            if (!acc[field]) acc[field] = issue.message;
            return acc;
        }, {} as Record<string, string>);
    }
    return {};
}

/** Ключ категории — дисциплина + рейтинг-группа. */
function categoryKey(category: string, ratingGroup: string | null): string {
    return `${category}:${(ratingGroup ?? 'OPEN').toUpperCase()}`;
}

/** Общие поля таблицы tournaments для insert и update. */
function buildTournamentRow(data: CreateTournamentInput) {
    return {
        title: data.title.trim(),
        location: data.city.trim(),
        venue: data.venue_name?.trim() || null,
        venue_address: data.venue_address?.trim() || null,
        organizer: data.organizer?.trim() || null,
        start_date: data.start_date,
        end_date: data.end_date || data.start_date,
        registration_time: data.registration_time?.trim() || null,
        start_time: data.start_time?.trim() || null,
        description: data.description?.trim() || null,
        contact_info: data.contact_info?.trim() || null,
        awards: data.awards?.trim() || null,
        registration_deadline: data.registration_deadline
            ? new Date(data.registration_deadline).toISOString()
            : null,
        has_entry_fee: typeof data.entry_fee === 'number' && data.entry_fee > 0,
        entry_fee_amount: data.entry_fee ?? null,
        entry_fee_note: data.entry_fee_note?.trim() || null,
        pdf_url: data.pdf_url ?? null,
        pdf_storage_path: data.pdf_storage_path ?? null,
    };
}

/**
 * Создание турнира
 */
export async function createTournament(
    input: CreateTournamentInput
): Promise<ActionResult<{ id: string }>> {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Нужно войти в аккаунт' };

    const isCoach = user.profile.role === 'coach' || user.profile.role === 'development';
    if (!isCoach) return { success: false, error: 'Только тренер может создавать турниры' };

    const parsed = createTournamentSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            error: 'Проверьте введённые данные',
            fieldErrors: extractFieldErrors(parsed.error),
        };
    }

    const data = parsed.data;
    const supabase = await createClient();

    const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
            ...buildTournamentRow(data),
            tournament_type: data.tournament_type || 'away',
            status: 'registration_open',
            created_by: user.id,
        })
        .select('id')
        .single();

    if (tournamentError || !tournament) {
        return { success: false, error: mapPgError(tournamentError, 'создать турнир') };
    }

    const categoriesInsert = data.categories.map((c) => ({
        tournament_id: tournament.id,
        category: c.category,
        rating_group: c.rating_group,
        age_group: c.rating_group === 'OPEN' ? null : `Группа ${c.rating_group}`,
        max_pairs: c.max_pairs ?? null,
        bracket_generated: false,
        participants_count: 0,
    }));

    const { error: categoriesError } = await supabase
        .from('tournament_categories')
        .insert(categoriesInsert);

    // Турнир без категорий бесполезен — откатываем, чтобы не оставлять мусор.
    if (categoriesError) {
        await supabase.from('tournaments').delete().eq('id', tournament.id);
        return { success: false, error: mapPgError(categoriesError, 'сохранить категории') };
    }

    revalidatePath('/tournaments');
    revalidatePath('/home');

    return { success: true, data: { id: tournament.id } };
}

/**
 * Редактирование турнира
 */
export async function updateTournament(
    id: string,
    input: CreateTournamentInput
): Promise<ActionResult<{ id: string }>> {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Нужно войти в аккаунт' };

    const parsed = createTournamentSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            error: 'Проверьте введённые данные',
            fieldErrors: extractFieldErrors(parsed.error),
        };
    }

    const data = parsed.data;
    const supabase = await createClient();

    const { data: existingTournament } = await supabase
        .from('tournaments')
        .select('id, created_by')
        .eq('id', id)
        .maybeSingle();

    if (!existingTournament) return { success: false, error: 'Турнир не найден' };

    const isCoach = user.profile.role === 'coach' || user.profile.role === 'development';
    const isOwner = existingTournament.created_by === user.id;
    if (!isCoach && !isOwner) {
        return { success: false, error: 'Нет прав на редактирование турнира' };
    }

    const { error: updateError } = await supabase
        .from('tournaments')
        .update({
            ...buildTournamentRow(data),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (updateError) {
        return { success: false, error: mapPgError(updateError, 'обновить турнир') };
    }

    // --- Синхронизация категорий по ключу «дисциплина + группа» ---
    const { data: existingCategories } = await supabase
        .from('tournament_categories')
        .select('id, category, rating_group, age_group, max_pairs')
        .eq('tournament_id', id);

    const existingMap = new Map(
        (existingCategories ?? []).map((c) => [
            categoryKey(
                c.category,
                c.rating_group ?? c.age_group?.replace(/^Группа\s+/i, '') ?? null
            ),
            c,
        ])
    );

    const desiredKeys = new Set<string>();
    const toInsert: Array<{
        tournament_id: string;
        category: CreateTournamentInput['categories'][number]['category'];
        rating_group: string;
        age_group: string | null;
        max_pairs: number | null;
        bracket_generated: boolean;
        participants_count: number;
    }> = [];

    for (const cat of data.categories) {
        const key = categoryKey(cat.category, cat.rating_group);
        if (desiredKeys.has(key)) continue; // защита от дублей в самой форме
        desiredKeys.add(key);

        const existing = existingMap.get(key);
        if (existing) {
            // Категория есть — дозаполняем rating_group у старых записей.
            if (existing.rating_group !== cat.rating_group || existing.max_pairs !== (cat.max_pairs ?? null)) {
                await supabase
                    .from('tournament_categories')
                    .update({
                        rating_group: cat.rating_group,
                        age_group: cat.rating_group === 'OPEN' ? null : `Группа ${cat.rating_group}`,
                        max_pairs: cat.max_pairs ?? null,
                    })
                    .eq('id', existing.id);
            }
            continue;
        }

        toInsert.push({
            tournament_id: id,
            category: cat.category,
            rating_group: cat.rating_group,
            age_group: cat.rating_group === 'OPEN' ? null : `Группа ${cat.rating_group}`,
            max_pairs: cat.max_pairs ?? null,
            bracket_generated: false,
            participants_count: 0,
        });
    }

    if (toInsert.length > 0) {
        const { error: insertError } = await supabase
            .from('tournament_categories')
            .insert(toInsert);

        if (insertError) {
            return { success: false, error: mapPgError(insertError, 'сохранить категории') };
        }
    }

    // Удаляем снятые категории, но только пустые — с участниками не трогаем.
    const removedIds = [...existingMap.entries()]
        .filter(([key]) => !desiredKeys.has(key))
        .map(([, cat]) => cat.id);

    if (removedIds.length > 0) {
        const { data: busy } = await supabase
            .from('tournament_participants')
            .select('category_id')
            .in('category_id', removedIds);

        const busyIds = new Set((busy ?? []).map((p) => p.category_id));
        const deletable = removedIds.filter((catId) => !busyIds.has(catId));

        if (deletable.length > 0) {
            await supabase.from('tournament_categories').delete().in('id', deletable);
        }

        if (deletable.length < removedIds.length) {
            revalidatePath('/tournaments');
            revalidatePath(`/tournaments/${id}`);
            revalidatePath(`/tournaments/${id}/edit`);
            return {
                success: true,
                data: { id },
                // категории с участниками сохранены — сообщаем об этом отдельно
            };
        }
    }

    revalidatePath('/tournaments');
    revalidatePath(`/tournaments/${id}`);
    revalidatePath(`/tournaments/${id}/edit`);

    return { success: true, data: { id } };
}

/**
 * Смена статуса турнира (открыть/закрыть регистрацию, завершить).
 */
export async function updateTournamentStatus(
    tournamentId: string,
    status: 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed'
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Нужно войти в аккаунт' };

    const supabase = await createClient();

    const { data: tournament } = await supabase
        .from('tournaments')
        .select('id, created_by')
        .eq('id', tournamentId)
        .maybeSingle();

    if (!tournament) return { success: false, error: 'Турнир не найден' };

    const isCoach = user.profile.role === 'coach' || user.profile.role === 'development';
    const isOwner = tournament.created_by === user.id;
    if (!isCoach && !isOwner) {
        return { success: false, error: 'Нет прав на изменение турнира' };
    }

    const { error } = await supabase
        .from('tournaments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', tournamentId);

    if (error) {
        return { success: false, error: mapPgError(error, 'изменить статус турнира') };
    }

    revalidatePath('/tournaments');
    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath('/home');
    return { success: true };
}

export async function deleteTournament(tournamentId: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Нужно войти в аккаунт' }

    const supabase = await createClient()

    const { data: tournament } = await supabase
        .from('tournaments')
        .select('id, created_by')
        .eq('id', tournamentId)
        .maybeSingle()

    if (!tournament) return { success: false, error: 'Турнир не найден' }

    const isCoach = user.profile.role === 'coach' || user.profile.role === 'development'
    const isOwner = tournament.created_by === user.id
    if (!isCoach && !isOwner) {
        return { success: false, error: 'Нет прав на удаление турнира' }
    }

    const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId)

    if (error) {
        console.error('[deleteTournament]', error)
        return { success: false, error: 'Не удалось удалить турнир' }
    }

    revalidatePath('/tournaments')
    revalidatePath('/home')
    return { success: true }
}
