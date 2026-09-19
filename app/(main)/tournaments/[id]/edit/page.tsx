import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/shared/lib/auth';
import { createClient } from '@/shared/lib/supabase/server';
import { TournamentForm, type InitialCategory } from '@/components/tournaments/tournament-form';
import type { ParsedTournament } from '@/shared/lib/ai/parse-tournament-pdf';

type RatingGroup = 'A' | 'B' | 'C' | 'D' | 'E';

function normalizeGroup(ratingGroup: string | null, ageGroup: string | null): RatingGroup {
    const raw = (ratingGroup ?? ageGroup ?? '')
        .replace(/^Группа\s+/i, '')
        .trim()
        .toUpperCase();
    return (['A', 'B', 'C', 'D', 'E'] as string[]).includes(raw) ? (raw as RatingGroup) : 'C';
}

export default async function EditTournamentPage({
                                                     params,
                                                 }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const supabase = await createClient();

    // Читаем турнир напрямую: нужны все поля формы, а не урезанный TournamentDetails
    const [tournamentRes, categoriesRes] = await Promise.all([
        supabase
            .from('tournaments')
            .select(`
                id, title, organizer, location, venue, venue_address,
                start_date, end_date, registration_time, start_time,
                registration_deadline, entry_fee_amount, entry_fee_note,
                description, contact_info, awards, pdf_url, pdf_storage_path,
                created_by
            `)
            .eq('id', id)
            .maybeSingle(),
        supabase
            .from('tournament_categories')
            .select('category, rating_group, age_group')
            .eq('tournament_id', id),
    ]);

    const tournament = tournamentRes.data;
    if (!tournament) notFound();

    const isOwner = user.id === tournament.created_by;
    const canManage =
        user.profile.role === 'coach' || user.profile.role === 'development' || isOwner;

    if (!canManage) redirect(`/tournaments/${id}`);

    const initialCategories: InitialCategory[] = (categoriesRes.data ?? []).map((c) => ({
        category: c.category,
        rating_group: normalizeGroup(c.rating_group, c.age_group),
    }));

    const initialData: ParsedTournament = {
        title: tournament.title,
        organizer: tournament.organizer,
        city: tournament.location ?? '',
        venue_name: tournament.venue,
        venue_address: tournament.venue_address,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        registration_time: tournament.registration_time,
        start_time: tournament.start_time,
        registration_deadline: tournament.registration_deadline
            ? tournament.registration_deadline.slice(0, 10)
            : null,
        entry_fee: tournament.entry_fee_amount,
        entry_fee_note: tournament.entry_fee_note,
        description: tournament.description,
        contact_info: tournament.contact_info,
        awards: tournament.awards,
        categories: [],
    };

    return (
        <div className="min-h-screen bg-app p-4 max-w-2xl mx-auto pb-20">
            <h1 className="text-xl font-bold text-strong mb-4">Редактирование турнира</h1>
            <TournamentForm
                mode="edit"
                tournamentId={id}
                initialData={initialData}
                initialCategories={initialCategories}
                pdfInfo={
                    tournament.pdf_url
                        ? { url: tournament.pdf_url, path: tournament.pdf_storage_path ?? '' }
                        : null
                }
            />
        </div>
    );
}
