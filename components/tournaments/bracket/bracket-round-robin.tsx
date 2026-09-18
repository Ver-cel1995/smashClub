'use client';

import { useMemo } from 'react';
import { PlayerSlot } from './player-slot';
import type { Participant } from '@/shared/types/bracket';

interface Props {
    rrPlayers: Participant[];
    onSlotClick: (index: number) => void;
    onSlotClear: (index: number, e: React.MouseEvent) => void;
}

export function BracketRoundRobin({ rrPlayers, onSlotClick, onSlotClear }: Props) {
    const rrMatrix = useMemo(() => {
        if (rrPlayers.length < 2) return [];
        const n = rrPlayers.length;
        const matches: { a: number; b: number }[] = [];
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                matches.push({ a: i, b: j });
            }
        }
        return matches;
    }, [rrPlayers]);

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Слоты участников */}
            <div>
                <h3 className="text-sm font-bold text-strong mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Участники группы ({rrPlayers.filter(Boolean).length}/{rrPlayers.length})
                </h3>
                <p className="text-xs text-muted mb-4">
                    Расставьте игроков. Таблица матчей обновится автоматически.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {rrPlayers.map((player, idx) => (
                        <div key={idx} className="bg-card border border-subtle rounded-xl overflow-hidden">
                            <div className="px-3 py-1.5 bg-subtle/40 border-b border-subtle text-[10px] text-dim font-mono">
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
                    Турнирная таблица
                </h3>
                <p className="text-xs text-muted mb-4">
                    Всего матчей: {rrMatrix.length} · Формат: каждый с каждым
                </p>

                <div className="overflow-x-auto rounded-xl border border-subtle">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                        <tr className="bg-card">
                            <th className="p-3 text-left text-xs text-dim font-bold border-b border-r border-subtle min-w-[140px]">
                                /
                            </th>
                            {rrPlayers.map((p, i) => (
                                <th
                                    key={i}
                                    className="p-2 text-center text-[11px] text-muted font-bold border-b border-r border-subtle min-w-[80px]"
                                >
                                    {p && p !== 'BYE' ? p.name.split(' ')[0] : `P${i + 1}`}
                                </th>
                            ))}
                            <th className="p-2 text-center text-[11px] text-accent font-bold border-b border-subtle min-w-[48px]">
                                В
                            </th>
                            <th className="p-2 text-center text-[11px] text-dim font-bold border-b border-subtle min-w-[48px]">
                                П
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {rrPlayers.map((rowPlayer, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-hover/50">
                                <td className="p-3 text-xs font-semibold text-strong border-b border-r border-subtle bg-card">
                                    {rowPlayer && rowPlayer !== 'BYE' ? (
                                        <>
                                            {rowPlayer.name}
                                            <span className="block text-[10px] text-dim font-normal">
                          {rowPlayer.rating}
                        </span>
                                        </>
                                    ) : (
                                        <span className="text-muted">Слот {rowIdx + 1}</span>
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
                                        <td
                                            key={colIdx}
                                            className="p-2 text-center border-b border-r border-subtle cursor-pointer hover:bg-accent/10 transition-colors"
                                        >
                                            <span className="text-[11px] text-muted font-mono">vs</span>
                                        </td>
                                    );
                                })}
                                <td className="p-2 text-center border-b border-subtle font-mono text-accent font-bold text-xs">
                                    0
                                </td>
                                <td className="p-2 text-center border-b border-subtle font-mono text-dim text-xs">
                                    0
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}