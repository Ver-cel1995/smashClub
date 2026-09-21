'use client';

import { useMemo, useState } from 'react';
import { PlayerSlot } from './player-slot';
import type { Participant, MatchResult } from '@/shared/types/bracket';
import { generateRoundRobinSchedule } from '@/shared/lib/tournament/bracket-engine';
import { MatchScoreModal } from './modals/match-score-modal';

interface Props {
    rrPlayers: Participant[];
    matchResults?: Record<string, MatchResult>;
    onSlotClick: (index: number) => void;
    onSlotClear: (index: number, e: React.MouseEvent) => void;
    onScoreSubmit?: (matchId: string, result: MatchResult) => void;
}

// Тайп-гард для проверки, что игрок — это реальный объект, а не null / 'BYE'
type RealPlayer = { id: string; name: string; rating: number };
function isRealPlayer(p: Participant): p is RealPlayer {
    return Boolean(p && p !== 'BYE' && typeof p === 'object' && 'id' in p);
}

// Хелпер для генерации стабильного ID матча
const getRRMatchId = (p1Id: string, p2Id: string) => {
    return `rr_${[p1Id, p2Id].sort().join('_')}`;
};

export function BracketRoundRobin({ rrPlayers, matchResults = {}, onSlotClick, onSlotClear, onScoreSubmit }: Props) {
    const [activeMatch, setActiveMatch] = useState<{ id: string; p1: RealPlayer; p2: RealPlayer } | null>(null);

    const schedule = useMemo(() => {
        const count = rrPlayers.filter(isRealPlayer).length;
        if (count < 2) return [];
        return generateRoundRobinSchedule(count);
    }, [rrPlayers]);

    // Подсчет статистики турнирной таблицы
    const stats = useMemo(() => {
        const s: Record<string, { wins: number; losses: number }> = {};
        rrPlayers.forEach((p) => {
            if (isRealPlayer(p)) s[p.id] = { wins: 0, losses: 0 };
        });

        Object.entries(matchResults).forEach(([matchKey, res]) => {
            if (!res.winnerId) return;

            if (s[res.winnerId]) s[res.winnerId].wins += 1;

            // Извлекаем ID игроков из ключа rr_ID1_ID2
            const parts = matchKey.replace('rr_', '').split('_');
            const loserId = parts.find((id) => id !== res.winnerId);
            if (loserId && s[loserId]) s[loserId].losses += 1;
        });
        return s;
    }, [matchResults, rrPlayers]);

    const handleMatchClick = (p1: RealPlayer, p2: RealPlayer) => {
        setActiveMatch({
            id: getRRMatchId(p1.id, p2.id),
            p1,
            p2,
        });
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Участники группы */}
            <div>
                <h3 className="text-sm font-bold text-strong mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Участники группы ({rrPlayers.filter(isRealPlayer).length}/{rrPlayers.length})
                </h3>
                <p className="text-xs text-muted mb-4">
                    Расставьте игроков. Расписание и таблица сгенерируются автоматически.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {rrPlayers.map((player, idx) => (
                        <div key={idx} className="bg-card border border-subtle rounded-xl overflow-hidden shadow-sm">
                            <div className="px-3 py-1.5 bg-subtle/40 border-b border-subtle text-[10px] text-dim font-mono font-bold">
                                Слот {idx + 1}
                            </div>
                            <PlayerSlot
                                player={player}
                                onClick={() => onSlotClick(idx)}
                                onClear={(e) => onSlotClear(idx, e)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Турнирная таблица */}
            <div>
                <h3 className="text-sm font-bold text-strong mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Турнирная матрица
                </h3>
                <p className="text-[11px] text-muted mb-3">Кликайте по ячейкам &quot;vs&quot; для ввода счёта.</p>

                <div className="overflow-x-auto rounded-xl border border-subtle shadow-sm">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                        <tr className="bg-card">
                            <th className="p-3 text-left text-xs text-dim font-bold border-b border-r border-subtle min-w-[140px]">
                                Участник
                            </th>
                            {rrPlayers.map((p, i) => (
                                <th key={i} className="p-2 text-center text-[11px] text-muted font-bold border-b border-r border-subtle min-w-[80px]">
                                    {isRealPlayer(p) ? p.name.split(' ')[0] : `P${i + 1}`}
                                </th>
                            ))}
                            <th className="p-2 text-center text-[11px] text-accent font-bold border-b border-subtle min-w-[48px]">В</th>
                            <th className="p-2 text-center text-[11px] text-dim font-bold border-b border-subtle min-w-[48px]">П</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rrPlayers.map((rowPlayer, rowIdx) => {
                            const isRowReal = isRealPlayer(rowPlayer);
                            const pStats = isRowReal ? stats[rowPlayer.id] : { wins: 0, losses: 0 };

                            return (
                                <tr key={rowIdx} className="hover:bg-hover/50 transition-colors">
                                    <td className="p-3 text-xs font-semibold text-strong border-b border-r border-subtle bg-card">
                                        {isRowReal ? (
                                            <>
                                                {rowPlayer.name}
                                                <span className="block text-[10px] text-dim font-normal font-mono">
                                                    Рейтинг: {rowPlayer.rating}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-muted italic">Слот {rowIdx + 1}</span>
                                        )}
                                    </td>

                                    {rrPlayers.map((colPlayer, colIdx) => {
                                        if (rowIdx === colIdx) {
                                            return (
                                                <td key={colIdx} className="p-2 text-center border-b border-r border-subtle bg-subtle/30">
                                                    <span className="text-dim text-xs">—</span>
                                                </td>
                                            );
                                        }

                                        const isColReal = isRealPlayer(colPlayer);
                                        const canPlay = isRowReal && isColReal;
                                        const matchId = canPlay ? getRRMatchId(rowPlayer.id, colPlayer.id) : null;
                                        const result = matchId ? matchResults[matchId] : null;

                                        return (
                                            <td
                                                key={colIdx}
                                                onClick={() => {
                                                    if (isRowReal && isColReal) {
                                                        handleMatchClick(rowPlayer, colPlayer);
                                                    }
                                                }}
                                                className={`p-2 text-center border-b border-r border-subtle transition-colors ${
                                                    canPlay ? 'cursor-pointer hover:bg-accent/10 hover:border-accent/40' : 'opacity-50'
                                                }`}
                                            >
                                                {result && isRowReal ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] font-black text-accent">
                                                            {result.winnerId === rowPlayer.id ? 'В' : 'П'}
                                                        </span>
                                                        <span className="text-[9px] font-mono text-dim tracking-tighter">
                                                            {result.scores.map((s) => `${s.p1}:${s.p2}`).join(' ')}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-muted font-mono">vs</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 text-center border-b border-subtle font-mono text-accent font-bold text-xs bg-accent/5">
                                        {pStats?.wins || 0}
                                    </td>
                                    <td className="p-2 text-center border-b border-subtle font-mono text-dim text-xs">
                                        {pStats?.losses || 0}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Расписание туров */}
            {schedule.length > 0 && (
                <div className="pt-4 border-t border-subtle">
                    <h3 className="text-sm font-bold text-strong mb-3">Расписание туров (Circle Method)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {Array.from(new Set(schedule.map((m) => m.round))).map((roundNum) => {
                            const roundMatches = schedule.filter((m) => m.round === roundNum);
                            return (
                                <div key={roundNum} className="p-3 bg-card border border-subtle rounded-xl text-xs space-y-1.5">
                                    <span className="font-bold text-accent uppercase tracking-wider text-[10px]">
                                        Тур {roundNum}
                                    </span>
                                    {roundMatches.map((m, idx) => {
                                        const p1 = rrPlayers[m.player1Index];
                                        const p2 = rrPlayers[m.player2Index];
                                        const p1Real = isRealPlayer(p1);
                                        const p2Real = isRealPlayer(p2);

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    if (p1Real && p2Real) handleMatchClick(p1, p2);
                                                }}
                                                className={`flex justify-between items-center text-muted font-mono text-[11px] bg-subtle/30 p-1.5 rounded transition-colors ${
                                                    p1Real && p2Real ? 'cursor-pointer hover:bg-accent/10 hover:text-accent' : ''
                                                }`}
                                            >
                                                <span>{p1Real ? p1.name.split(' ')[0] : `P${m.player1Index + 1}`}</span>
                                                <span className="text-dim text-[9px]">vs</span>
                                                <span>{p2Real ? p2.name.split(' ')[0] : `P${m.player2Index + 1}`}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeMatch && (
                <MatchScoreModal
                    matchId={activeMatch.id}
                    p1Name={activeMatch.p1.name}
                    p2Name={activeMatch.p2.name}
                    p1Id={activeMatch.p1.id}
                    p2Id={activeMatch.p2.id}
                    initialResult={matchResults[activeMatch.id]}
                    onClose={() => setActiveMatch(null)}
                    onSubmit={(res) => {
                        if (onScoreSubmit) onScoreSubmit(activeMatch.id, res);
                        setActiveMatch(null);
                    }}
                />
            )}
        </div>
    );
}