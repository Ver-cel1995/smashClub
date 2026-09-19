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

    // Чистый город без бесконечных склеек
    const location = data.city.trim();

    const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
            title: data.title,
            tournament_type: data.tournament_type || 'away',
            status: 'draft',
            location,
            venue: data.venue_name || null,
            start_date: data.start_date,
            end_date: data.end_date || data.start_date,
            description: data.description || null,
            registration_deadline: data.registration_deadline
                ? new Date(data.registration_deadline).toISOString()
                : null,
            has_entry_fee: typeof data.entry_fee === 'number' && data.entry_fee > 0,
            entry_fee_amount: data.entry_fee ?? null,
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
        max_pairs: null,
        bracket_generated: false,
        participants_count: 0,
    }));

    await supabase.from('tournament_categories').insert(categoriesInsert);

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
            start_date: data.start_date,
            end_date: data.end_date || data.start_date,
            description: data.description || null,
            registration_deadline: data.registration_deadline
                ? new Date(data.registration_deadline).toISOString()
                : null,
            has_entry_fee: typeof data.entry_fee === 'number' && data.entry_fee > 0,
            entry_fee_amount: data.entry_fee ?? null,
            pdf_url: data.pdf_url,
            pdf_storage_path: data.pdf_storage_path,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (updateError) {
        return { success: false, error: mapPgError(updateError, 'обновить турнир') };
    }

    // Умная синхронизация категорий
    const { data: existingCategories } = await supabase
        .from('tournament_categories')
        .select('id, category, age_group')
        .eq('tournament_id', id);

    const existingMap = new Map(
        (existingCategories || []).map((c) => [`${c.category}:${c.age_group}`, c.id])
    );

    const newKeys = new Set<string>();

    for (const cat of data.categories) {
        const key = `${cat.category}:${cat.age_group}`;
        newKeys.add(key);

        if (!existingMap.has(key)) {
            await supabase.from('tournament_categories').insert({
                tournament_id: id,
                category: cat.category as any,
                age_group: cat.age_group,
                max_pairs: null,
                bracket_generated: false,
                participants_count: 0,
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