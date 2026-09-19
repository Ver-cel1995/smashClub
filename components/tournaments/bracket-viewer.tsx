import Link from 'next/link';
import { Settings2, Trophy } from 'lucide-react';
import { createClient } from '@/shared/lib/supabase/server';
import type {
    ParticipantRecord,
    TournamentCategoryFull,
} from '@/app/(main)/tournaments/[id]/queries';

interface Props {
    tournamentId: string;
    categories: TournamentCategoryFull[];
    currentUserId?: string;
    canManage: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
    MS: 'Мужская одиночка',
    WS: 'Женская одиночка',
    MD: 'Мужская пара',
    WD: 'Женская пара',
    XD: 'Смешанная пара',
};

type DbMatch = {
    id: string;
    category_id: string;
    round: number;
    position: number;
    participant1_id: string | null;
    participant2_id: string | null;
    winner_id: string | null;
    status: string | null;
    placeholder_p1: string | null;
    placeholder_p2: string | null;
};

function recordName(rec: ParticipantRecord | undefined): string {
    if (!rec) return '—';
    const p1 = rec.player1?.full_name?.split(' ')[0] ?? 'Игрок';
    if (rec.player2) {
        const p2 = rec.player2.full_name?.split(' ')[0] ?? 'Игрок';
        return `${p1} / ${p2}`;
    }
    return p1;
}

// полноценный просмотр сеток
export async function BracketViewer({ tournamentId, categories, canManage }: Props) {
    const readyCategories = categories.filter((c) => c.bracket_status === 'ready');

    // Загружаем матчи готовых сеток
    let matchesByCategory: Record<string, DbMatch[]> = {};
    if (readyCategories.length > 0) {
        const supabase = await createClient();
        const { data: matches } = await supabase
            .from('tournament_matches')
            .select(
                'id, category_id, round, position, participant1_id, participant2_id, winner_id, status, placeholder_p1, placeholder_p2'
            )
            .in(
                'category_id',
                readyCategories.map((c) => c.id)
            )
            .order('round', { ascending: true })
            .order('position', { ascending: true });

        matchesByCategory = (matches ?? []).reduce((acc, m) => {
            if (!m.category_id) return acc;
            (acc[m.category_id] ??= []).push(m as DbMatch);
            return acc;
        }, {} as Record<string, DbMatch[]>);
    }

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
                <div className="space-y-6">
                    {readyCategories.map((cat) => {
                        const matches = matchesByCategory[cat.id] ?? [];
                        // Карта id записи → имя (участники + ищущие пару)
                        const nameMap = new Map<string, string>();
                        [...cat.participants, ...cat.seekers].forEach((rec) =>
                            nameMap.set(rec.id, recordName(rec))
                        );

                        const nameFor = (m: DbMatch, slot: 'p1' | 'p2') => {
                            const placeholder = slot === 'p1' ? m.placeholder_p1 : m.placeholder_p2;
                            if (placeholder === 'BYE') return 'BYE';
                            const pid = slot === 'p1' ? m.participant1_id : m.participant2_id;
                            return (pid && nameMap.get(pid)) || 'Ожидание';
                        };

                        // Группируем по раундам
                        const rounds = matches.reduce((acc, m) => {
                            (acc[m.round] ??= []).push(m);
                            return acc;
                        }, {} as Record<number, DbMatch[]>);
                        const roundKeys = Object.keys(rounds)
                            .map(Number)
                            .sort((a, b) => a - b);

                        return (
                            <div key={cat.id} className="bg-card border border-subtle rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-4 border-b border-subtle pb-3">
                                    <Trophy className="w-4 h-4 text-accent" />
                                    <h3 className="text-sm font-bold text-strong">
                                        {CATEGORY_LABELS[cat.category] ?? cat.category}
                                    </h3>
                                    {cat.rating_group && (
                                        <span className="text-[10px] font-black bg-accent/15 text-accent border border-accent/30 px-2 py-0.5 rounded-md">
                                            Группа {cat.rating_group}
                                        </span>
                                    )}
                                </div>

                                {matches.length === 0 ? (
                                    <p className="text-xs text-muted italic py-4 text-center">
                                        Матчи ещё не расставлены
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <div className="flex gap-8 min-w-max pb-2">
                                            {roundKeys.map((round) => (
                                                <div key={round} className="flex flex-col gap-3 w-[220px]">
                                                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
                                                        {round === roundKeys[roundKeys.length - 1] && roundKeys.length > 1
                                                            ? 'Финал'
                                                            : `Раунд ${round}`}
                                                    </p>
                                                    {rounds[round].map((m) => {
                                                        const n1 = nameFor(m, 'p1');
                                                        const n2 = nameFor(m, 'p2');
                                                        const w1 = m.winner_id && m.winner_id === m.participant1_id;
                                                        const w2 = m.winner_id && m.winner_id === m.participant2_id;
                                                        return (
                                                            <div
                                                                key={m.id}
                                                                className="border border-subtle rounded-xl overflow-hidden bg-subtle/20"
                                                            >
                                                                <div
                                                                    className={`px-3 py-2 text-xs font-semibold ${
                                                                        w1 ? 'text-accent bg-accent/10' : 'text-strong'
                                                                    }`}
                                                                >
                                                                    {n1}
                                                                </div>
                                                                <div className="h-px bg-subtle" />
                                                                <div
                                                                    className={`px-3 py-2 text-xs font-semibold ${
                                                                        w2 ? 'text-accent bg-accent/10' : 'text-strong'
                                                                    }`}
                                                                >
                                                                    {n2}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}