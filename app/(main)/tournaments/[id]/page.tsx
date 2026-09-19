import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/shared/lib/auth'
import { TournamentTabs, type TournamentTabId } from './tournament-tabs'
import { ShuttleLoader } from '@/components/shared/shuttle-loader'
import { BracketViewer } from '@/components/tournaments/bracket-viewer'
import { TournamentParticipantsSection } from '@/components/tournaments/tournament-participants-section'
import { TournamentHeader } from '@/components/tournaments/tournament-header'
import { getTournamentDetails } from '@/app/(main)/tournaments/[id]/queries'
import { RegistrationFab } from '@/components/tournaments/registration-fab'

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

    return (
        <div className="flex flex-col min-h-screen bg-app pb-24">
            <TournamentHeader tournament={data} canManage={canManage} />

            <div className="sticky top-14 z-10 bg-app/90 backdrop-blur-md border-b border-card">
                <TournamentTabs tournamentId={data.id} active={activeTab} />
            </div>

            <main className="flex-1 p-4 max-w-3xl mx-auto w-full space-y-6 mt-4">
                {activeTab === 'overview' && (
                    <div className="bg-card border border-subtle rounded-2xl p-5 shadow-sm space-y-4">
                        <h2 className="text-sm font-bold text-strong uppercase tracking-widest border-b border-subtle pb-2">
                            Информация о турнире
                        </h2>
                        {data.description ? (
                            <p className="whitespace-pre-wrap text-sm text-main leading-relaxed">
                                {data.description}
                            </p>
                        ) : (
                            <p className="text-sm text-muted italic">Описание не добавлено</p>
                        )}

                        {data.pdf_url && (
                            <a
                                href={data.pdf_url}
                                target="_blank"
                                rel="noopener"
                                className="flex items-center gap-2 text-accent text-sm font-semibold hover:underline bg-accent/5 p-3 rounded-xl border border-accent/20 w-fit"
                            >
                                📄 Скачать Положение (PDF)
                            </a>
                        )}
                    </div>
                )}

                {activeTab === 'participants' && (
                    <Suspense fallback={<div className="flex justify-center p-12"><ShuttleLoader /></div>}>
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
                    </Suspense>
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
                    currentUserGender={(user?.profile?.gender as never) ?? null}
                />
            )}
        </div>
    )
}