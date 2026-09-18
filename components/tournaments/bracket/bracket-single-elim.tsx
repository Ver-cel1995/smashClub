'use client';

import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { PlayerSlot } from './player-slot';
import type { LocalMatch, Participant } from '@/shared/types/bracket';

interface Props {
    startingMatches: LocalMatch[];
    onSlotClick: (matchIndex: number, slot: 'p1' | 'p2') => void;
    onSlotClear: (matchIndex: number, slot: 'p1' | 'p2', e: React.MouseEvent) => void;
}

export function BracketSingleElim({ startingMatches, onSlotClick, onSlotClear }: Props) {
    const rounds = useMemo(() => {
        if (startingMatches.length === 0) return [];
        let currentMatches = startingMatches.length;
        const calculatedRounds = [];
        let roundIndex = 1;

        while (currentMatches >= 1) {
            let roundName = `Раунд ${roundIndex}`;
            if (currentMatches === 1) roundName = 'Финал';
            else if (currentMatches === 2) roundName = 'Полуфинал';
            else if (currentMatches === 4) roundName = '1/4 финала';
            else if (currentMatches === 8) roundName = '1/8 финала';
            else if (currentMatches === 16) roundName = '1/16 финала';

            calculatedRounds.push({
                id: `r${roundIndex}`,
                name: roundName,
                matchCount: currentMatches,
                isStarting: roundIndex === 1,
            });
            currentMatches /= 2;
            roundIndex++;
        }
        return calculatedRounds;
    }, [startingMatches]);

    return (
        <div className="min-w-max min-h-full p-12 flex gap-12 items-center">
            {rounds.map((round, rIndex) => (
                <div key={round.id} className="flex flex-col w-[260px] relative h-full">
                    <div className="absolute -top-10 left-0 text-[11px] font-bold text-muted tracking-widest uppercase flex items-center gap-2">
                        {round.matchCount === 1 ? (
                            <>
                                <Trophy className="w-3.5 h-3.5 text-accent" />
                                <span className="text-accent">{round.name}</span>
                            </>
                        ) : (
                            <>
                                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                {round.name} ({round.matchCount})
                            </>
                        )}
                    </div>
                    <div className="flex flex-col flex-1 justify-around gap-6 relative z-10">
                        {Array.from({ length: round.matchCount }).map((_, mIndex) => {
                            const hasConnector = rIndex < rounds.length - 1;
                            const currentMatch = round.isStarting ? startingMatches[mIndex] : null;
                            return (
                                <div key={`${round.id}-m${mIndex}`} className="relative group">
                                    {hasConnector && (
                                        <div className="absolute right-0 top-1/2 w-6 border-t-2 border-subtle translate-x-full z-0" />
                                    )}
                                    <div
                                        className={`relative w-full border rounded-xl overflow-hidden z-10 flex flex-col ${
                                            round.matchCount === 1
                                                ? 'border-accent shadow-[0_0_20px_rgba(198,244,50,0.1)]'
                                                : 'border-subtle bg-card'
                                        }`}
                                    >
                                        {round.isStarting && currentMatch ? (
                                            <>
                                                <PlayerSlot
                                                    player={currentMatch.p1}
                                                    isTop
                                                    onClick={() => currentMatch.p1 !== 'BYE' && onSlotClick(mIndex, 'p1')}
                                                    onClear={(e) => onSlotClear(mIndex, 'p1', e)}
                                                />
                                                <div className="w-full h-px bg-subtle" />
                                                <PlayerSlot
                                                    player={currentMatch.p2}
                                                    onClick={() => currentMatch.p2 !== 'BYE' && onSlotClick(mIndex, 'p2')}
                                                    onClear={(e) => onSlotClear(mIndex, 'p2', e)}
                                                />
                                            </>
                                        ) : (
                                            <div className="py-8 text-center bg-subtle/20">
                                                <span className="text-[11px] text-muted font-medium uppercase tracking-widest">
                                                  Ожидание
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}