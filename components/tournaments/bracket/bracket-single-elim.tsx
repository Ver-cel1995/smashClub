'use client';

import { useMemo, useState, useRef } from 'react';
import { Trophy, GitCommit, ZoomIn, ZoomOut, Maximize2, Search, X, Check, Edit3 } from 'lucide-react';
import { PlayerSlot } from './player-slot';
import type { LocalMatch, MatchResult } from '@/shared/types/bracket';
import {
    buildFullBracketRounds,
    calculateBracketConfig,
    generateQualifyingRound,
    generateMainBracketAfterQualifying,
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

const MATCH_BLOCK = 88;

// 1. Задаём дефолтный пустой массив startingMatches = []
export function BracketSingleElim({
                                      startingMatches = [], // ← ДОБАВЛЕНО `= []`
                                      matchResults = {},
                                      onSlotClick,
                                      onSlotClear,
                                      onScoreSubmit,
                                  }: Props) {
    const [zoom, setZoom] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMatchForScore, setActiveMatchForScore] = useState<any | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // 2. Безопасный сбор игроков с фоллбэком (startingMatches || [])
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

    // 3. Безопасный вызов displayRounds
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

    // 🎯 ИКОНКА ЛУПЫ: ПЕРЕМЕЩЕНИЕ (СКРОЛЛ) К НУЖНОМУ ИГРОКУ
    const handleSearchJump = () => {
        if (!searchQuery.trim()) return;
        const q = searchQuery.toLowerCase().trim();

        // Ищем элемент матча с подсвеченным классом
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
    const canvasH = Math.max(480, r1Count * MATCH_BLOCK);

    return (
        <div className="relative min-h-full flex flex-col">
            {/* ВЕРХНЯЯ ПАНЕЛЬ С ЛУПОЙ И ZOOM */}
            <div className="sticky top-0 z-30 bg-card border-b border-subtle p-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
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
                        {/* 🎯 КНОПКА ЛУПЫ ДЛЯ ПЕРЕМЕЩЕНИЯ (СКРОЛЛА) */}
                        <button
                            type="button"
                            onClick={handleSearchJump}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
                            title="Переместиться к игроку"
                        >
                            <Search className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 bg-subtle/30 rounded-xl p-1 border border-subtle">
                    <button type="button" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.4))} className="p-1.5 text-muted hover:text-strong">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="px-2 text-xs font-mono font-bold text-strong">{Math.round(zoom * 100)}%</span>
                    <button type="button" onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))} className="p-1.5 text-muted hover:text-strong">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setZoom(0.6)} className="p-1.5 text-muted hover:text-accent ml-1 border-l border-subtle">
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ХОЛСТ СЕТКИ */}
            <div ref={containerRef} className="flex-1 overflow-auto scrollbar-thin">
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }} className="inline-block">
                    <div className="p-8 flex gap-12 items-start min-w-max">

                        {/* КВАЛИФИКАЦИЯ */}
                        {bracketConfig.hasQualifyingRound && (
                            <div className="flex flex-col w-[270px] shrink-0 border-r-2 border-dashed border-accent/40 pr-8">
                                <div className="mb-4 text-[11px] font-bold text-accent tracking-widest uppercase flex items-center gap-2 sticky top-0 bg-app py-2 z-20">
                                    <span>КВАЛИФИКАЦИЯ ({qualifyingMatches.length})</span>
                                </div>
                                <div className="flex flex-col justify-around" style={{ height: canvasH }}>
                                    {qualifyingMatches.map((qm) => (
                                        <div key={qm.id} className="p-3 bg-card border border-subtle rounded-xl text-xs">
                                            {/* 🎯 ЗАЩИЩЁННАЯ ПРОВЕРКА 'name' in qm.p1 */}
                                            <p className="font-bold text-strong">
                                                {qm.p1 && typeof qm.p1 === 'object' && 'name' in qm.p1 ? qm.p1.name : '—'}
                                            </p>
                                            <p className="text-dim text-[10px]">vs</p>
                                            <p className="font-bold text-strong">
                                                {qm.p2 && typeof qm.p2 === 'object' && 'name' in qm.p2 ? qm.p2.name : '—'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 🎯 РЕНДЕР ДЕРЕВА С ПРОДВИЖЕНИЕМ ПОБЕДИТЕЛЕЙ */}
                        {displayRounds.map((round, rIndex) => (
                            <div key={round.id} className="flex flex-col w-[260px] shrink-0">
                                <div className="mb-4 text-[11px] font-bold text-muted tracking-widest uppercase flex items-center gap-2 sticky top-0 bg-app py-2 z-20">
                                    {round.matchCount === 1 ? (
                                        <span className="text-accent font-black flex items-center gap-1.5">
                                            <Trophy className="w-4 h-4" /> {round.name}
                                        </span>
                                    ) : (
                                        <span>{round.name} ({round.matchCount})</span>
                                    )}
                                </div>

                                <div className="flex flex-col justify-around" style={{ height: canvasH }}>
                                    {round.matches.map((match, mIndex) => {
                                        const isStartingRound = rIndex === 0 && !bracketConfig.hasQualifyingRound;

                                        const p1IsMatch = highlightedPlayerId && match.p1 && typeof match.p1 === 'object' && 'id' in match.p1 && match.p1.id === highlightedPlayerId;
                                        const p2IsMatch = highlightedPlayerId && match.p2 && typeof match.p2 === 'object' && 'id' in match.p2 && match.p2.id === highlightedPlayerId;
                                        const isHighlighted = p1IsMatch || p2IsMatch;

                                        const canJudge = match.p1 && match.p2 && match.p1 !== 'BYE' && match.p2 !== 'BYE' && !('placeholder' in match.p1) && !('placeholder' in match.p2);

                                        // 🎯 Форматируем счёт
                                        const scoreText = formatScore(match.result);
                                        const isWalkover = match.result?.isWalkover;
                                        const isRetired = match.result?.isRetired;
                                        const hasBadge = Boolean(scoreText || isWalkover || isRetired);

                                        return (
                                            <div
                                                key={match.id}
                                                data-highlighted={isHighlighted ? 'true' : 'false'}
                                                onClick={() => canJudge && setActiveMatchForScore(match)}
                                                className={`relative group border rounded-xl overflow-hidden shadow-sm transition-all ${
                                                    canJudge ? 'cursor-pointer hover:border-accent/80' : ''
                                                } ${isHighlighted ? 'ring-2 ring-accent border-accent bg-accent/10' : 'border-subtle bg-card'}`}
                                            >
                                                <SlotRender player={match.p1} winner={match.winner} hasResult={match.hasResult} isTop />

                                                {/* 🎯 РАЗДЕЛИТЕЛЬ С ЯРКИМ СЧЁТОМ МАТЧА */}
                                                <div className="relative w-full h-px bg-subtle">
                                                    {hasBadge && (
                                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-accent/40 px-2 py-0.5 rounded-md shadow-md flex items-center gap-1.5 z-10 whitespace-nowrap">
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
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-accent text-accent-foreground p-1.5 rounded-lg shadow-md">
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* МОДАЛКА ВВОДА СЧЁТА */}
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
        return <div className="px-3 py-2 text-dim text-[10px] font-bold uppercase tracking-wider">BYE</div>;
    }

    if (player && typeof player === 'object' && 'placeholder' in player) {
        return <div className="px-3 py-2.5 text-dim text-[11px] italic bg-subtle/10">{player.placeholder}</div>;
    }

    if (player && typeof player === 'object' && 'name' in player) {
        const isWinner = winner && typeof winner === 'object' && winner.id === player.id;
        const isLoser = hasResult && !isWinner; // Если есть результат, но он не победитель - значит проиграл

        return (
            <div className={`px-3 py-2.5 flex items-center justify-between transition-colors ${
                isWinner ? 'bg-accent/10' : isLoser ? 'opacity-50' : 'bg-transparent'
            }`}>
                <div className="flex flex-col min-w-0">
                    <span className={`text-xs truncate ${isWinner ? 'font-black text-accent decoration-2' : 'font-semibold text-strong'}`}>
                        {player.name}
                    </span>
                    <span className="text-[9px] text-dim font-mono mt-0.5">Рейтинг: {player.rating}</span>
                </div>
                {isWinner && <Check className="w-3.5 h-3.5 text-accent shrink-0 ml-2" />}
            </div>
        );
    }

    return <div className="px-3 py-2.5 text-xs text-muted">Ожидание...</div>;
}