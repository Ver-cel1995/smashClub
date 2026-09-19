'use server';

import {createClient} from '@/shared/lib/supabase/server';
import {ActionResult} from '@/shared/lib/actions/types';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {mapPgError} from '@/shared/lib/actions/pg-errors';
import {getCurrentUser} from "@/shared/lib/auth";

const VALID_GROUPS = ['A', 'B', 'C', 'D', 'E'] as const;

// хелпер: из "Группа C" / "c" / ISO-мусора вытащить код группы A–E или null.
function extractRatingGroup(ageGroup: string | null | undefined): string | null {
    if (!ageGroup) return null;
    const g = ageGroup.replace(/^Группа\s+/i, '').trim().toUpperCase();
    return (VALID_GROUPS as readonly string[]).includes(g) ? g : null;
}

// Гибкая дата: пустая строка "" превращается в null,
// а ISO-таймстамп "2026-01-01T00:00:00.000Z" — в "2026-01-01".
const optionalDateSchema = z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
        if (!val || val.trim() === '') return null;
        // Отрезаем время у ISO / оставляем как есть, если уже YYYY-MM-DD
        return val.slice(0, 10);
    })
    .refine((val) => val === null || /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: 'Укажите дату в формате ГГГГ-ММ-ДД',
    });

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
                    age_group: z.string().nullable().optional(),
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

/**
 * Создание турнира
 */
export async function createTournament(
    input: CreateTournamentInput
): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
    const location = data.city.trim();

    const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
            title: data.title,
            tournament_type: data.tournament_type || 'away',
            status: 'draft',
            location,
            venue: data.venue_name || null,
            organizer: data.organizer || null,
            venue_address: data.venue_address || null,
            start_date: data.start_date,
            end_date: data.end_date || data.start_date,
            registration_time: data.registration_time || null,
            start_time: data.start_time || null,
            description: data.description || null,
            registration_deadline: data.registration_deadline
                ? new Date(data.registration_deadline).toISOString()
                : null,
            has_entry_fee: typeof data.entry_fee === 'number' && data.entry_fee > 0,
            entry_fee_amount: data.entry_fee ?? null,
            entry_fee_note: data.entry_fee_note || null,
            awards: data.awards || null,
            contact_info: data.contact_info || null,
            pdf_url: data.pdf_url,
            pdf_storage_path: data.pdf_storage_path,
            created_by: user.id,
        })
        .select('id')
        .single();

    if (tournamentError || !tournament) {
        return { success: false, error: mapPgError(tournamentError, 'создать турнир') };
    }

    // Категории
    const categoriesInsert = data.categories.map((c) => ({
        tournament_id: tournament.id,
        category: c.category as any,
        age_group: c.age_group,
        rating_group: extractRatingGroup(c.age_group),
        max_pairs: null,
        bracket_generated: false,
        participants_count: 0,
    }));

    const { data: insertedCategories, error: categoriesError } = await supabase
        .from('tournament_categories')
        .insert(categoriesInsert)
        .select('id');

    if (categoriesError) {
        console.error('[createTournament:categories]', {
            error: categoriesError,
            attempted: categoriesInsert.map((c) => `${c.category}/${c.rating_group}`),
        });
        // Откатываем «пустой» турнир, чтобы не оставлять его без категорий
        await supabase.from('tournaments').delete().eq('id', tournament.id);
        return { success: false, error: mapPgError(categoriesError, 'сохранить категории турнира') };
    }

    if ((insertedCategories?.length ?? 0) !== categoriesInsert.length) {
        console.error('[createTournament:categories] partial insert', {
            expected: categoriesInsert.length,
            inserted: insertedCategories?.length ?? 0,
        });
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
    const location = data.city.trim();

    const { error: updateError } = await supabase
        .from('tournaments')
        .update({
            title: data.title,
            location,
            venue: data.venue_name || null,
            organizer: data.organizer || null,
            venue_address: data.venue_address || null,
            start_date: data.start_date,
            end_date: data.end_date || data.start_date,
            registration_time: data.registration_time || null,
            start_time: data.start_time || null,
            description: data.description || null,
            registration_deadline: data.registration_deadline
                ? new Date(data.registration_deadline).toISOString()
                : null,
            has_entry_fee: typeof data.entry_fee === 'number' && data.entry_fee > 0,
            entry_fee_amount: data.entry_fee ?? null,
            entry_fee_note: data.entry_fee_note || null,
            awards: data.awards || null,
            contact_info: data.contact_info || null,
            pdf_url: data.pdf_url,
            pdf_storage_path: data.pdf_storage_path,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (updateError) {
        return { success: false, error: mapPgError(updateError, 'обновить турнир') };
    }

    // умная синхронизация категорий по СТАБИЛЬНОМУ ключу discipline:group.
    const { data: existingCategories } = await supabase
        .from('tournament_categories')
        .select('id, category, age_group, rating_group')
        .eq('tournament_id', id);

    // Ключ строим из category + нормализованной группы,
    // иначе "Группа C" и rating_group="C" считаются разными и категории плодятся/удаляются
    const keyOf = (category: string, ageGroup: string | null, ratingGroup?: string | null) =>
        `${category}:${ratingGroup ?? extractRatingGroup(ageGroup) ?? '-'}`;

    const existingMap = new Map(
        (existingCategories || []).map((c) => [
            keyOf(c.category, c.age_group, c.rating_group),
            c.id,
        ])
    );

    const newKeys = new Set<string>();
    const toInsert: Array<{
        tournament_id: string;
        category: any;
        age_group: string | null | undefined;
        rating_group: string | null;
        max_pairs: null;
        bracket_generated: boolean;
        participants_count: number;
    }> = [];

    for (const cat of data.categories) {
        const key = keyOf(cat.category, cat.age_group ?? null);
        newKeys.add(key);

        if (!existingMap.has(key)) {
            toInsert.push({
                tournament_id: id,
                category: cat.category as any,
                age_group: cat.age_group,
                rating_group: extractRatingGroup(cat.age_group),
                max_pairs: null,
                bracket_generated: false,
                participants_count: 0,
            });
        }
    }

    if (toInsert.length > 0) {
        const { data: insertedCategories, error: insertError } = await supabase
            .from('tournament_categories')
            .insert(toInsert)
            .select('id');

        if (insertError) {
            console.error('[updateTournament:categories]', {
                error: insertError,
                attempted: toInsert.map((c) => `${c.category}/${c.rating_group}`),
            });
            return { success: false, error: mapPgError(insertError, 'сохранить категории турнира') };
        }

        if ((insertedCategories?.length ?? 0) !== toInsert.length) {
            console.error('[updateTournament:categories] partial insert', {
                expected: toInsert.length,
                inserted: insertedCategories?.length ?? 0,
            });
        }
    }

    for (const [key, catId] of existingMap.entries()) {
        if (!newKeys.has(key)) {
            const { count } = await supabase
                .from('tournament_participants')
                .select('id', { count: 'exact', head: true })
                .eq('category_id', catId);

            if (!count || count === 0) {
                await supabase.from('tournament_categories').delete().eq('id', catId);
            }
        }
    }

    revalidatePath('/tournaments');
    revalidatePath(`/tournaments/${id}`);
    revalidatePath(`/tournaments/${id}/edit`);

    return { success: true, data: { id } };
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