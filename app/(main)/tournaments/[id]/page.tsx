import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import {getCurrentUser} from '@/shared/lib/auth';
import {TournamentTabs} from './tournament-tabs';
import {ShuttleLoader} from '@/components/shared/shuttle-loader';
import {BracketViewer} from '@/components/tournaments/bracket-viewer';
import {TournamentParticipantsSection} from "@/components/tournaments/tournament-participants-section";
import {TournamentHeader} from "@/components/tournaments/tournament-header";
import {getTournamentDetails} from "@/app/(main)/tournaments/[id]/queries";
import {RegistrationFab} from "@/components/tournaments/registration-fab";

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getCurrentUser();
    const data = await getTournamentDetails(id, user?.id);

    if (!data) notFound();

    const isOwner = user?.id === data.created_by;
    const isCoach = user?.role === 'coach' || user?.role === 'development';
    const canManage = isCoach || isOwner;

    const isRegistrationOpen = data.status === 'registration_open' || data.status === 'draft'

    const showRegistrationFab = isRegistrationOpen && !!user; // Доступно ВСЕМ авторизованным!

    return (
        <div className="flex flex-col min-h-screen bg-app pb-24">
            {/* 1. ШАПКА ТУРНИРА */}
            <TournamentHeader tournament={data} canManage={canManage} />

            {/* 2. НАВИГАЦИЯ (ТАБЫ) */}
            <div className="sticky top-14 z-10 bg-app/90 backdrop-blur-md border-b border-card">
                <TournamentTabs />
            </div>

            {/* 3. КОНТЕНТ (Переключается через CSS :target или query-параметры) */}
            <main className="flex-1 p-4 max-w-3xl mx-auto w-full space-y-6 mt-4">
                <Suspense fallback={<div className="flex justify-center p-12"><ShuttleLoader /></div>}>

                    {/* ТАБ: ОБЗОР (По умолчанию) */}
                    <div id="overview" className="tab-content block">
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
                    </div>

                    {/* ТАБ: УЧАСТНИКИ И РЕГИСТРАЦИЯ */}
                    <div id="participants" className="tab-content hidden">
                        <TournamentParticipantsSection
                            tournamentId={data.id}
                            categories={data.categories}
                            myParticipation={data.my_participation}
                            currentUserId={user?.id || ''}
                            isCoach={canManage}
                            isRegistrationOpen={data.status === 'registration_open' || data.status === 'draft'}
                            entryFee={data.entry_fee_amount}
                            hasEntryFee={data.has_entry_fee}
                        />
                    </div>

                    {/* ТАБ: СЕТКИ */}
                    <div id="brackets" className="tab-content hidden">
                        <BracketViewer
                            tournamentId={data.id}
                            categories={data.categories}
                            currentUserId={user?.id}
                            canManage={canManage}
                        />
                    </div>
                </Suspense>
            </main>
            {showRegistrationFab &&
                <RegistrationFab
                    tournamentId={data.id}
                    categories={data.categories}
                    myParticipation={data.my_participation}
                    hasEntryFee={data.has_entry_fee}
                    entryFee={data.entry_fee_amount}
                    currentUserId={''}
                    currentUserGender={null}/>
            }
        </div>
    );
}