'use client';

import { useMemo } from 'react';
import { PlayerSlot } from './player-slot';
import type { Participant } from '@/shared/types/bracket';
import { generateRoundRobinSchedule } from '@/shared/lib/tournament/bracket-engine';

interface Props {
    rrPlayers: Participant[];
    onSlotClick: (index: number) => void;
    onSlotClear: (index: number, e: React.MouseEvent) => void;
}

export function BracketRoundRobin({ rrPlayers, onSlotClick, onSlotClear }: Props) {
    // Вычисление расписания туров
    const schedule = useMemo(() => {
        const count = rrPlayers.filter(Boolean).length;
        if (count < 2) return [];
        return generateRoundRobinSchedule(count);
    }, [rrPlayers]);

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Участники группы */}
            <div>
                <h3 className="text-sm font-bold text-strong mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Участники группы ({rrPlayers.filter(Boolean).length}/{rrPlayers.length})
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

                <div className="overflow-x-auto rounded-xl border border-subtle shadow-sm mt-3">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                        <tr className="bg-card">
                            <th className="p-3 text-left text-xs text-dim font-bold border-b border-r border-subtle min-w-[140px]">
                                Участник
                            </th>
                            {rrPlayers.map((p, i) => (
                                <th
                                    key={i}
                                    className="p-2 text-center text-[11px] text-muted font-bold border-b border-r border-subtle min-w-[80px]"
                                >
                                    {p && p !== 'BYE' ? p.name.split(' ')[0] : `P${i + 1}`}
                                </th>
                            ))}
                            <th className="p-2 text-center text-[11px] text-accent font-bold border-b border-subtle min-w-[48px]">В</th>
                            <th className="p-2 text-center text-[11px] text-dim font-bold border-b border-subtle min-w-[48px]">П</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rrPlayers.map((rowPlayer, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-hover/50">
                                <td className="p-3 text-xs font-semibold text-strong border-b border-r border-subtle bg-card">
                                    {rowPlayer && rowPlayer !== 'BYE' ? (
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
                                {rrPlayers.map((_, colIdx) => {
                                    if (rowIdx === colIdx) {
                                        return (
                                            <td key={colIdx} className="p-2 text-center border-b border-r border-subtle bg-subtle/30">
                                                <span className="text-dim text-xs">—</span>
                                            </td>
                                        );
                                    }
                                    return (
                                        <td key={colIdx} className="p-2 text-center border-b border-r border-subtle hover:bg-accent/10 transition-colors">
                                            <span className="text-[11px] text-muted font-mono">vs</span>
                                        </td>
                                    );
                                })}
                                <td className="p-2 text-center border-b border-subtle font-mono text-accent font-bold text-xs">0</td>
                                <td className="p-2 text-center border-b border-subtle font-mono text-dim text-xs">0</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Сгенерированные туры (Circle Method) */}
            {schedule.length > 0 && (
                <div className="pt-4 border-t border-subtle">
                    <h3 className="text-sm font-bold text-strong mb-3">Расписание туров (Circle Method)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {Array.from(new Set(schedule.map(m => m.round))).map(roundNum => {
                            const roundMatches = schedule.filter(m => m.round === roundNum);
                            return (
                                <div key={roundNum} className="p-3 bg-card border border-subtle rounded-xl text-xs space-y-1.5">
                                    <span className="font-bold text-accent uppercase tracking-wider text-[10px]">
                                        Тур {roundNum}
                                    </span>
                                    {roundMatches.map((m, idx) => {
                                        const p1 = rrPlayers[m.player1Index];
                                        const p2 = rrPlayers[m.player2Index];
                                        return (
                                            <div key={idx} className="flex justify-between items-center text-muted font-mono text-[11px] bg-subtle/30 p-1.5 rounded">
                                                <span>{p1 && p1 !== 'BYE' ? p1.name.split(' ')[0] : `P${m.player1Index + 1}`}</span>
                                                <span className="text-dim text-[9px]">vs</span>
                                                <span>{p2 && p2 !== 'BYE' ? p2.name.split(' ')[0] : `P${m.player2Index + 1}`}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}