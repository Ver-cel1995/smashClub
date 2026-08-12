import { getCurrentUser } from '@/shared/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, MapPin, Calendar } from 'lucide-react'
import { getTournamentFullData } from './queries'
import { TournamentActionsMenu } from '@/components/tournaments/tournament-actions-menu'
import { TournamentParticipantsSection } from '@/components/tournaments/tournament-participants-section'
import { PendingInvitesBanner } from '@/components/tournaments/pending-invites-banner'
import { RegistrationFab } from '@/components/tournaments/registration-fab'

export default async function TournamentPage({
                                                 params,
                                             }: {
    params: Promise<{ id: string }>
}) {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    const { id } = await params
    const data = await getTournamentFullData(id, user.userId)
    if (!data) notFound()

    const { tournament, categories, my_participation, my_pending_invites } = data
    const isCoach = user.profile.role === 'coach'

    // Проверка что регистрация ещё открыта
    const now = new Date()
    const deadline = tournament.registration_deadline
        ? new Date(tournament.registration_deadline)
        : new Date(tournament.start_date)
    const isRegistrationOpen = deadline > now

    // Всего категорий, в которые я записан
    const myCategoryIds = Object.keys(my_participation)
    const availableCategoriesCount = categories.length - myCategoryIds.length

    return (
        <div className="space-y-4 p-4 pb-24">
            <div className="flex items-center justify-between gap-2">
                <Link
                    href="/tournaments"
                    className="inline-flex items-center gap-2 text-sm text-muted hover:text-strong"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Все турниры
                </Link>

                {isCoach && (
                    <TournamentActionsMenu tournamentId={tournament.id} title={tournament.title} />
                )}
            </div>

            {/* Приглашения ко мне — жёлтая плашка сверху */}
            {my_pending_invites.length > 0 && (
                <PendingInvitesBanner
                    invites={my_pending_invites}
                    categories={categories}
                />
            )}

            {/* Основная инфа */}
            <div className="space-y-3 rounded-2xl border border-card bg-card p-4">
                <h1 className="text-xl font-bold text-strong">{tournament.title}</h1>

                <div className="space-y-2 text-sm text-muted">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>{tournament.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>
                            {new Date(tournament.start_date).toLocaleDateString('ru-RU')}
                            {tournament.end_date &&
                                ' – ' + new Date(tournament.end_date).toLocaleDateString('ru-RU')}
                        </span>
                    </div>
                </div>

                {tournament.description && (
                    <p className="whitespace-pre-line text-sm text-main">
                        {tournament.description}
                    </p>
                )}

                {tournament.pdf_url && (
                    <a
                        href={tournament.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-accent bg-accent-muted px-3 py-2 text-sm font-semibold text-accent"
                    >
                        <FileText className="h-4 w-4" />
                        Открыть положение
                    </a>
                )}
            </div>

            {/* Категории с участниками */}
            <TournamentParticipantsSection
                tournamentId={tournament.id}
                categories={categories}
                myParticipation={my_participation}
                currentUserId={user.userId}
                isCoach={isCoach}
                isRegistrationOpen={isRegistrationOpen}
                entryFee={tournament.entry_fee_amount}
                hasEntryFee={tournament.has_entry_fee ?? false}
            />

            {/* FAB: кнопка «Участвовать» */}
            {isRegistrationOpen && availableCategoriesCount > 0 && (
                <RegistrationFab
                    tournamentId={tournament.id}
                    categories={categories}
                    myParticipation={my_participation}
                    currentUserId={user.userId}
                    entryFee={tournament.entry_fee_amount}
                    hasEntryFee={tournament.has_entry_fee ?? false}
                    currentUserGender={user.profile.gender ?? null}
                />
            )}
        </div>
    )
}