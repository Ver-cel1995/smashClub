import Link from 'next/link';
import { ChevronLeft, MapPin, Calendar, Clock, Edit3, Wallet } from 'lucide-react';
import type { TournamentDetails } from '@/app/(main)/tournaments/[id]/queries';
import { TournamentActionsMenu } from './tournament-actions-menu';

export function TournamentHeader({
                                     tournament,
                                     canManage,
                                 }: {
    tournament: TournamentDetails;
    canManage: boolean;
}) {
    const formatDate = (d: string) => {
        try {
            return new Date(d).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return d;
        }
    };

    const isRegOpen =
        tournament.status === 'registration_open' || tournament.status === 'draft';

    return (
        <div className="bg-card border-b border-card p-4 space-y-3">
            {/* Верхний ряд: Назад + Статус + Редактировать */}
            <div className="flex items-center justify-between">
                <Link
                    href="/tournaments"
                    className="flex items-center gap-1 text-xs text-muted hover:text-strong transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Все турниры
                </Link>

                <div className="flex items-center gap-2">
                    {isRegOpen ? (
                        <span className="text-[10px] bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              ● Регистрация открыта
            </span>
                    ) : (
                        <span className="text-[10px] bg-subtle text-muted border border-subtle px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Регистрация закрыта
            </span>
                    )}

                    {canManage && (
                        <>
                            <Link
                                href={`/tournaments/${tournament.id}/edit`}
                                className="p-1.5 rounded-lg bg-subtle hover:bg-hover text-muted hover:text-strong transition-colors"
                                title="Редактировать турнир"
                            >
                                <Edit3 className="w-4 h-4" />
                            </Link>
                            <TournamentActionsMenu
                                tournamentId={tournament.id}
                                title={tournament.title}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Название турнира */}
            <div>
                <h1 className="text-xl font-bold text-strong">{tournament.title}</h1>
                <p className="text-xs text-dim mt-0.5">
                    {tournament.tournament_type === 'home' ? '🏠 Домашний турнир' : '🚗 Выездной турнир'}
                </p>
            </div>

            {/* Место и Даты */}
            <div className="flex flex-wrap gap-4 text-xs text-muted pt-1">
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>
            {tournament.location}
                        {tournament.venue ? ` (${tournament.venue})` : ''}
          </span>
                </div>

                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>
            {formatDate(tournament.start_date)} — {formatDate(tournament.end_date)}
          </span>
                </div>

                {tournament.registration_deadline && isRegOpen && (
                    <div className="flex items-center gap-1.5 text-warning font-medium">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>До {formatDate(tournament.registration_deadline)}</span>
                    </div>
                )}

                {tournament.has_entry_fee && tournament.entry_fee_amount ? (
                    <div className="flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>{tournament.entry_fee_amount} ₽ за категорию</span>
                    </div>
                ) : null}
            </div>
        </div>
    );
}