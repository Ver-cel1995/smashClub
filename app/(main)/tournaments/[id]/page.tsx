import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/shared/lib/auth'
import { TournamentTabs, type TournamentTabId } from './tournament-tabs'
import { BracketViewer } from '@/components/tournaments/bracket-viewer'
import { TournamentParticipantsSection } from '@/components/tournaments/tournament-participants-section'
import { TournamentHeader } from '@/components/tournaments/tournament-header'
import { getTournamentDetails } from '@/app/(main)/tournaments/[id]/queries'
import { RegistrationFab } from '@/components/tournaments/registration-fab'
import { PendingInvitesBanner } from '@/components/tournaments/pending-invites-banner'
import type { Gender } from '@/shared/lib/gender'

// страница персональная (участие, пол пользователя) — рендерим всегда свежей,
// чтобы не показывать устаревший gender / myParticipation из кэша.
export const dynamic = 'force-dynamic'

type Props = {
    params: Promise<{ id: string }>
    searchParams: Promise<{ tab?: string }>
}

function resolveTab(raw: string | undefined): TournamentTabId {
    if (raw === 'participants' || raw === 'brackets') return raw
    return 'overview'
}

export default async function TournamentPage({ params, searchParams }: Props) {
    const [{ id }, { tab }] = await Promise.all([params, searchParams])
    const activeTab = resolveTab(tab)

    const user = await getCurrentUser()
    const data = await getTournamentDetails(id, user?.id)

    if (!data) notFound()

    const isOwner = Boolean(user?.id && user.id === data.created_by)
    const isCoach = user?.profile?.role === 'coach' || user?.profile?.role === 'development'
    const canManage = isCoach || isOwner

    const isRegistrationOpen = data.status === 'registration_open' || data.status === 'draft'
    const showRegistrationFab = isRegistrationOpen && Boolean(user)

    const currentUserGender = (user?.profile?.gender ?? null) as Gender | null

    // собираем входящие приглашения в пару: я = player2 и статус ожидает подтверждения.
    const pendingInvites = user
        ? data.categories
            .flatMap((cat) => [...cat.participants, ...cat.seekers])
            .filter(
                (rec) =>
                    rec.player2?.kind === 'player' &&
                    rec.player2.id === user.id &&
                    rec.pair_status === 'pending'
            )
        : []

    return (
        <div className="flex flex-col min-h-screen bg-app pb-24">
            <TournamentHeader tournament={data} canManage={canManage} />

            <div className="sticky top-14 z-10 bg-app/90 backdrop-blur-md border-b border-card">
                <TournamentTabs tournamentId={data.id} active={activeTab} />
            </div>


            <main className="flex-1 p-4 max-w-3xl mx-auto w-full space-y-6 mt-4">
                {/* баннер приглашений в пару — виден на всех вкладках */}
                {pendingInvites.length > 0 && (
                    <PendingInvitesBanner invites={pendingInvites} categories={data.categories} />
                )}

                {activeTab === 'participants' && (
                        <TournamentParticipantsSection
                            tournamentId={data.id}
                            categories={data.categories}
                            myParticipation={data.my_participation}
                            currentUserId={user?.id ?? ''}
                            isCoach={canManage}
                            isRegistrationOpen={isRegistrationOpen}
                            entryFee={data.entry_fee_amount}
                            hasEntryFee={data.has_entry_fee}
                        />
                )}

                {activeTab === 'brackets' && (
                        <BracketViewer
                            tournamentId={data.id}
                            categories={data.categories}
                            currentUserId={user?.id}
                            canManage={canManage}
                        />
                )}
            </main>

            {showRegistrationFab && (
                <RegistrationFab
                    tournamentId={data.id}
                    categories={data.categories}
                    myParticipation={data.my_participation}
                    hasEntryFee={data.has_entry_fee}
                    entryFee={data.entry_fee_amount}
                    currentUserId={user?.id ?? ''}
                    currentUserGender={currentUserGender}
                />
            )}
        </div>
    )
}