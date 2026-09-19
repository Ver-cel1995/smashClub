import Link from 'next/link';
import { Settings2, Trophy } from 'lucide-react';

interface Props {
    tournamentId: string;
    categories: any[];
    currentUserId?: string;
    canManage: boolean;
}

export function BracketViewer({ tournamentId, categories, canManage }: Props) {
    const readyCategories = categories.filter(c => c.bracket_status === 'ready');

    return (
        <div className="space-y-6 animate-in fade-in duration-300">

            {/* КНОПКА КОНСТРУКТОРА ДЛЯ ТРЕНЕРА */}
            {canManage && (
                <div className="bg-accent/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_15px_rgba(198,244,50,0.05)]">
                    <div>
                        <h3 className="text-sm font-bold text-strong">Панель организатора</h3>
                        <p className="text-xs text-muted mt-0.5">Управляйте сетками и жеребьёвкой турнира</p>
                    </div>
                    <Link
                        href={`/tournaments/${tournamentId}/bracket`}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
                    >
                        <Settings2 className="w-4 h-4" />
                        Управление сетками
                    </Link>
                </div>
            )}

            {/* Содержимое сеток */}
            {readyCategories.length === 0 ? (
                <div className="text-center py-12 bg-card border border-subtle rounded-2xl">
                    <Trophy className="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-strong font-bold">Сетки ещё не опубликованы</p>
                    <p className="text-xs text-muted mt-1">Ожидайте жеребьёвки после закрытия регистрации</p>
                </div>
            ) : (
                <div className="p-4 bg-card border border-subtle rounded-2xl">
                    <p className="text-sm text-main">Сетки сгенерированы и доступны для просмотра.</p>
                </div>
            )}
        </div>
    );
}