'use client';

import { useMemo, useState, useRef } from 'react';
import { Trophy, ZoomIn, ZoomOut, Maximize2, Search, X, Check, Edit3 } from 'lucide-react';
import type { LocalMatch, MatchResult } from '@/shared/types/bracket';
import {
    buildFullBracketRounds,
    calculateBracketConfig,
    generateQualifyingRound,
    EnginePlayer,
    EngineMatch,
} from '@/shared/lib/tournament/bracket-engine';
import { MatchScoreModal } from './modals/match-score-modal';

interface Props {
    startingMatches: LocalMatch[];
    matchResults?: Record<string, MatchResult>;
    onSlotClick?: (matchIndex: number, slot: 'p1' | 'p2') => void;
    onSlotClear?: (matchIndex: number, slot: 'p1' | 'p2', e: React.MouseEvent) => void;
    onScoreSubmit?: (matchId: string, result: MatchResult) => void;
}

// РАЗМЕРЫ ДЛЯ ИДЕАЛЬНОЙ ЦЕНТРОВКИ И СОЕДИНИТЕЛЕЙ
const MATCH_HEIGHT = 88;
const MATCH_GAP = 28;
const MATCH_UNIT = MATCH_HEIGHT + MATCH_GAP;

// Формула точной вертикальной позиции центра матча в любом раунде
const getMatchTop = (roundIndex: number, matchIndex: number) => {
    if (roundIndex === 0) return matchIndex * MATCH_UNIT;
    const offset = (Math.pow(2, roundIndex) - 1) * (MATCH_UNIT / 2);
    const spacing = Math.pow(2, roundIndex) * MATCH_UNIT;
    return offset + matchIndex * spacing;
};

export function BracketSingleElim({
                                      startingMatches = [],
                                      matchResults = {},
                                      onSlotClick,
                                      onSlotClear,
                                      onScoreSubmit,
                                  }: Props) {
    const [zoom, setZoom] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMatchForScore, setActiveMatchForScore] = useState<any | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const allPlayers = useMemo<EnginePlayer[]>(() => {
        const list: EnginePlayer[] = [];
        (startingMatches || []).forEach((m) => {
            if (m?.p1 && typeof m.p1 === 'object' && 'name' in m.p1) list.push(m.p1 as EnginePlayer);
            if (m?.p2 && typeof m.p2 === 'object' && 'name' in m.p2) list.push(m.p2 as EnginePlayer);
        });
        return list;
    }, [startingMatches]);

    const bracketConfig = useMemo(() => calculateBracketConfig(allPlayers.length), [allPlayers]);

    const qualifyingMatches = useMemo(
        () => (bracketConfig.hasQualifyingRound ? generateQualifyingRound(allPlayers) : []),
        [allPlayers, bracketConfig]
    );

    const displayRounds = useMemo(() => {
        if (!startingMatches || startingMatches.length === 0) return [];
        const engineMatches: EngineMatch[] = (startingMatches || []).map((m, idx) => ({
            id: m?.id || `main_r1_m${idx + 1}`,
            round: 1,
            position: idx + 1,
            p1: m?.p1 as any,
            p2: m?.p2 as any,
        }));
        return buildFullBracketRounds(engineMatches, matchResults);
    }, [startingMatches, matchResults]);

    function formatScore(result: any): string {
        if (!result) return '';
        const scores = result.scores || result.score;
        if (!scores) return '';

        if (Array.isArray(scores)) {
            return scores
                .map((s: any) => {
                    if (typeof s === 'object' && s !== null) {
                        if ('p1' in s && 'p2' in s) return `${s.p1}:${s.p2}`;
                        if ('score1' in s && 'score2' in s) return `${s.score1}:${s.score2}`;
                    }
                    if (typeof s === 'string') return s;
                    return '';
                })
                .filter(Boolean)
                .join('  ');
        }
        if (typeof scores === 'string') return scores;
        return '';
    }

    const handleSearchJump = () => {
        if (!searchQuery.trim()) return;
        const element = containerRef.current?.querySelector('[data-highlighted="true"]');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
    };

    const highlightedPlayerId = useMemo(() => {
        if (!searchQuery.trim()) return null;
        const q = searchQuery.toLowerCase().trim();
        const found = allPlayers.find((p) => p.name.toLowerCase().includes(q));
        return found?.id || null;
    }, [searchQuery, allPlayers]);

    if (!startingMatches || startingMatches.length === 0) {
        return (
            <div className="h-full flex items-center justify-center p-8 text-center text-xs text-muted">
                Сетка не содержит матчей или ещё не инициализирована.
            </div>
        );
    }

    const r1Count = displayRounds[0]?.matchCount || 1;
    const canvasH = Math.max(480, r1Count * MATCH_UNIT);

    return (
        <div className="relative min-h-full flex flex-col">
            <div className="sticky top-0 z-30 bg-card border-b border-subtle p-3 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchJump()}
                            placeholder="Поиск игрока по фамилии..."
                            className="w-full bg-subtle/50 border border-subtle rounded-xl pl-3 pr-20 py-1.5 text-sm text-strong placeholder:text-muted focus:outline-none focus:border-accent"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-strong"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleSearchJump}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
                        >
                            <Search className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 bg-subtle/30 rounded-xl p-1 border border-subtle">
                    <button type="button" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))} className="p-1.5 text-muted hover:text-strong">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="px-2 text-xs font-mono font-bold text-strong">{Math.round(zoom * 100)}%</span>
                    <button type="button" onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))} className="p-1.5 text-muted hover:text-strong">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setZoom(0.85)} className="p-1.5 text-muted hover:text-accent ml-1 border-l border-subtle">
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div ref={containerRef} className="flex-1 overflow-auto scrollbar-thin bg-app">
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }} className="inline-block p-10 min-w-max">
                    <div className="flex gap-12 items-start">

                        {bracketConfig.hasQualifyingRound && (
                            <div className="flex flex-col w-[260px] shrink-0 border-r-2 border-dashed border-subtle pr-12 relative">
                                <div className="mb-6 text-[11px] font-bold text-accent tracking-widest uppercase sticky top-0 z-20">
                                    Квалификация ({qualifyingMatches.length})
                                </div>
                                <div className="relative w-full" style={{ height: canvasH }}>
                                    {qualifyingMatches.map((qm, idx) => (
                                        <div
                                            key={qm.id}
                                            className="absolute w-full bg-card border border-subtle rounded-xl text-xs flex flex-col justify-center px-3"
                                            style={{ top: idx * MATCH_UNIT, height: MATCH_HEIGHT }}
                                        >
                                            <p className="font-bold text-strong truncate">{qm.p1 && typeof qm.p1 === 'object' && 'name' in qm.p1 ? qm.p1.name : '—'}</p>
                                            <p className="text-dim text-[10px] my-1 font-mono">vs</p>
                                            <p className="font-bold text-strong truncate">{qm.p2 && typeof qm.p2 === 'object' && 'name' in qm.p2 ? qm.p2.name : '—'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {displayRounds.map((round, rIndex) => (
                            <div key={round.id} className="flex flex-col w-[260px] shrink-0">
                                <div className="mb-6 text-[11px] font-bold text-muted tracking-widest uppercase flex items-center gap-2 sticky top-0 z-20">
                                    {round.matchCount === 1 ? (
                                        <span className="text-accent font-black flex items-center gap-1.5">
                                            <Trophy className="w-4 h-4" /> {round.name}
                                        </span>
                                    ) : (
                                        <span>{round.name} ({round.matchCount})</span>
                                    )}
                                </div>

                                <div className="relative w-full" style={{ height: canvasH }}>
                                    {round.matches.map((match, mIndex) => {
                                        const topPos = getMatchTop(rIndex, mIndex);
                                        const p1IsMatch = highlightedPlayerId && match.p1 && typeof match.p1 === 'object' && 'id' in match.p1 && match.p1.id === highlightedPlayerId;
                                        const p2IsMatch = highlightedPlayerId && match.p2 && typeof match.p2 === 'object' && 'id' in match.p2 && match.p2.id === highlightedPlayerId;
                                        const isHighlighted = p1IsMatch || p2IsMatch;

                                        const canJudge = match.p1 && match.p2 && match.p1 !== 'BYE' && match.p2 !== 'BYE' && !('placeholder' in match.p1) && !('placeholder' in match.p2);
                                        const scoreText = formatScore(match.result);
                                        const isWalkover = match.result?.isWalkover;
                                        const isRetired = match.result?.isRetired;
                                        const hasBadge = Boolean(scoreText || isWalkover || isRetired);

                                        // Точные координаты родителей из предыдущего раунда
                                        const parent0Top = rIndex > 0 ? getMatchTop(rIndex - 1, mIndex * 2) : 0;
                                        const parent1Top = rIndex > 0 ? getMatchTop(rIndex - 1, mIndex * 2 + 1) : 0;

                                        return (
                                            <div
                                                key={match.id}
                                                className="absolute w-full"
                                                style={{ top: topPos, height: MATCH_HEIGHT }}
                                                data-highlighted={isHighlighted ? 'true' : 'false'}
                                            >
                                                {/* 1. ХВОСТИК ВПРАВО (к следующему раунду) */}
                                                {rIndex < displayRounds.length - 1 && (
                                                    <div
                                                        className="absolute z-0 pointer-events-none"
                                                        style={{
                                                            top: MATCH_HEIGHT / 2 - 1,
                                                            left: '100%',
                                                            width: '24px',
                                                            height: '2px',
                                                            backgroundColor: 'var(--accent-color)',
                                                            opacity: 0.75,
                                                        }}
                                                    />
                                                )}

                                                {/* 2. ЛЕВАЯ ВХОДЯЩАЯ СКОБКА (от двух матчей предыдущего раунда) */}
                                                {rIndex > 0 && (
                                                    <>
                                                        {/* Вертикальная перемычка точно по центру зазора */}
                                                        <div
                                                            className="absolute z-0 pointer-events-none"
                                                            style={{
                                                                top: parent0Top - topPos + MATCH_HEIGHT / 2,
                                                                height: parent1Top - parent0Top,
                                                                left: '-24px',
                                                                width: '2px',
                                                                backgroundColor: 'var(--accent-color)',
                                                                opacity: 0.75,
                                                            }}
                                                        />
                                                        {/* Входящий хвостик от вертикальной перемычки в текущую карточку */}
                                                        <div
                                                            className="absolute z-0 pointer-events-none"
                                                            style={{
                                                                top: MATCH_HEIGHT / 2 - 1,
                                                                left: '-24px',
                                                                width: '24px',
                                                                height: '2px',
                                                                backgroundColor: 'var(--accent-color)',
                                                                opacity: 0.75,
                                                            }}
                                                        />
                                                    </>
                                                )}

                                                {/* КАРТОЧКА МАТЧА */}
                                                <div
                                                    onClick={() => canJudge && setActiveMatchForScore(match)}
                                                    className={`group relative z-10 w-full h-full border rounded-xl overflow-visible shadow-sm transition-all flex flex-col ${
                                                        canJudge ? 'cursor-pointer hover:border-accent/80' : ''
                                                    } ${isHighlighted ? 'ring-2 ring-accent border-accent bg-accent/10' : 'border-subtle bg-card'}`}
                                                >
                                                    <SlotRender player={match.p1} winner={match.winner} hasResult={match.hasResult} isTop />

                                                    <div className="relative w-full h-px bg-subtle">
                                                        {hasBadge && (
                                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-accent/40 px-2 py-0.5 rounded-md shadow-md flex items-center gap-1.5 z-20 whitespace-nowrap">
                                                                {scoreText && (
                                                                    <span className="text-[11px] font-mono font-black text-accent tracking-wider">
                                                                        {scoreText}
                                                                    </span>
                                                                )}
                                                                {isWalkover && <span className="text-[9px] font-bold text-danger uppercase">W/O</span>}
                                                                {isRetired && <span className="text-[9px] font-bold text-warning uppercase">Ret.</span>}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <SlotRender player={match.p2} winner={match.winner} hasResult={match.hasResult} />

                                                    {canJudge && !match.hasResult && (
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-accent text-accent-foreground p-1.5 rounded-lg shadow-md z-30">
                                                            <Edit3 className="w-3.5 h-3.5" />
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
                </div>
            </div>

            {activeMatchForScore && (
                <MatchScoreModal
                    matchId={activeMatchForScore.id}
                    p1Name={activeMatchForScore.p1?.name || 'Игрок 1'}
                    p2Name={activeMatchForScore.p2?.name || 'Игрок 2'}
                    p1Id={activeMatchForScore.p1?.id}
                    p2Id={activeMatchForScore.p2?.id}
                    initialResult={matchResults[activeMatchForScore.id]}
                    onClose={() => setActiveMatchForScore(null)}
                    onSubmit={(res) => {
                        if (onScoreSubmit) onScoreSubmit(activeMatchForScore.id, res);
                        setActiveMatchForScore(null);
                    }}
                />
            )}
        </div>
    );
}

function SlotRender({ player, winner, hasResult, isTop = false }: { player: any; winner?: any; hasResult?: boolean; isTop?: boolean }) {
    if (player === 'BYE') {
        return <div className={`flex-1 px-3 flex items-center text-dim text-[10px] font-bold uppercase tracking-wider ${isTop ? 'rounded-t-xl' : 'rounded-b-xl'}`}>BYE</div>;
    }

    if (player && typeof player === 'object' && 'placeholder' in player) {
        return <div className={`flex-1 px-3 flex items-center text-dim text-[11px] italic bg-subtle/10 ${isTop ? 'rounded-t-xl' : 'rounded-b-xl'}`}>{player.placeholder}</div>;
    }

    if (player && typeof player === 'object' && 'name' in player) {
        const isWinner = winner && typeof winner === 'object' && winner.id === player.id;
        const isLoser = hasResult && !isWinner;

        return (
            <div className={`flex-1 px-3 flex items-center justify-between transition-colors ${
                isWinner ? 'bg-accent/10' : isLoser ? 'opacity-40' : 'bg-transparent'
            } ${isTop ? 'rounded-t-xl' : 'rounded-b-xl'}`}>
                <div className="flex flex-col min-w-0 justify-center">
                    <span className={`text-xs truncate ${isWinner ? 'font-black text-accent' : 'font-semibold text-strong'}`}>
                        {player.name}
                    </span>
                    <span className="text-[9px] text-dim font-mono">Рейтинг: {player.rating}</span>
                </div>
                {isWinner && <Check className="w-3.5 h-3.5 text-accent shrink-0 ml-2" />}
            </div>
        );
    }

    return <div className={`flex-1 px-3 flex items-center text-xs text-muted ${isTop ? 'rounded-t-xl' : 'rounded-b-xl'}`}>Ожидание...</div>;
}