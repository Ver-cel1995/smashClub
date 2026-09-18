import { getTournamentDetails } from '../queries';
import { TournamentForm } from '@/components/tournaments/tournament-form';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/shared/lib/auth';

export default async function EditTournamentPage({params}: {params: Promise<{ id: string }>}) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const tournament = await getTournamentDetails(id, user.id);
    if (!tournament) notFound();

    const isOwner = user.id === tournament.created_by;
    const canManage = user.role === 'coach' || user.role === 'development' || isOwner;

    if (!canManage) redirect(`/tournaments/${id}`);

    // Формируем данные для формы
    const initialData = {
        title: tournament.title,
        organizer: '',
        city: tournament.location || '',
        venue_name: tournament.venue || '',
        venue_address: '',
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        registration_time: '',
        start_time: '',
        awards: '',
        registration_deadline: tournament.registration_deadline || '',
        entry_fee: tournament.entry_fee_amount,
        entry_fee_note: '',
        description: tournament.description || '',
        contact_info: '',
        categories: tournament.categories.map((c) => ({
            category: c.category,
            age_group: c.age_group || `Группа ${c.rating_group}`,
        })),
    };

    return (
        <div className="min-h-screen bg-app p-4 max-w-2xl mx-auto pb-20">
            <h1 className="text-xl font-bold text-strong mb-4">Редактирование турнира</h1>
            <TournamentForm
                mode="edit"
                tournamentId={id}
                initialData={initialData}
                pdfInfo={
                    tournament.pdf_url
                        ? { url: tournament.pdf_url, path: '' }
                        : null
                }
            />
        </div>
    );
}