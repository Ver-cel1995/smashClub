'use client';

import { useMemo, useState } from 'react';
import { Users, Trophy, ChevronRight, GitCommit } from 'lucide-react';
import type { GroupsThenSEData, EnginePlayer } from '@/shared/lib/tournament/bracket-engine';
import type { MatchResult } from '@/shared/types/bracket';
import { MatchScoreModal } from './modals/match-score-modal';

interface Props {
    data: GroupsThenSEData;
    matchResults?: Record<string, MatchResult>;
    onScoreSubmit?: (matchId: string, result: MatchResult) => void;
}

const MATCH_BLOCK = 78;

// Генератор ID для матчей в группе
const getGroupMatchId = (groupLabel: string, p1Id: string, p2Id: string) => {
    return `group_${groupLabel}_${[p1Id, p2Id].sort().join('_')}`;
};

export function BracketGroupsThenSE({ data, matchResults = {}, onScoreSubmit }: Props) {
    const { groups, playoffRounds, advanceCount } = data;
    const [activeMatch, setActiveMatch] = useState<{ id: string, p1: any, p2: any } | null>(null);

    const r1Count = playoffRounds[0]?.matchCount || 0;
    const canvasH = Math.max(420, r1Count * MATCH_BLOCK);

    return (
        <div className="p-6 flex flex-col gap-8 overflow-auto min-h-full bg-app">
            {/* ЭТАП 1: ГРУППЫ */}
            <section>
                <header className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-accent/10 border border-accent/20 rounded-lg text-accent">
                        <Users className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-strong uppercase tracking-widest">
                            Этап 1 · Групповой
                        </h2>
                        <p className="text-[11px] text-muted">
                            Групп: {groups.length} · Выходят Топ-{advanceCount} из каждой
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groups.map((g) => (
                        <GroupCard
                            key={g.label}
                            group={g}
                            advanceCount={advanceCount}
                            matchResults={matchResults}
                            onMatchClick={(p1, p2) => setActiveMatch({ id: getGroupMatchId(g.label, p1.id, p2.id), p1, p2 })}
                        />
                    ))}
                </div>
            </section>

            {/* ЭТАП 2: ПЛЕЙ-ОФФ */}
            <section className="border-t border-subtle pt-6">
                <header className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-accent/10 border border-accent/20 rounded-lg text-accent">
                        <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-strong uppercase tracking-widest">
                            Этап 2 · Плей-офф
                        </h2>
                        <p className="text-[11px] text-muted">
                            Олимпийская сетка заполняется автоматически после завершения групп
                        </p>
                    </div>
                </header>

                <div className="flex gap-10 items-start overflow-x-auto scrollbar-thin pb-4">
                    {playoffRounds.map((round, rIdx) => (
                        <div key={round.roundIndex} className="flex flex-col w-[220px] shrink-0">
                            <div className="mb-3 text-[11px] font-bold text-muted tracking-widest uppercase flex items-center gap-2 sticky top-0 bg-app py-2 z-20">
                                {round.matchCount === 1 ? (
                                    <>
                                        <Trophy className="w-4 h-4 text-accent" />
                                        <span className="text-accent font-black">{round.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 bg-accent rounded-full" />
                                        <span>{round.name}</span>
                                    </>
                                )}
                            </div>

                            <div className="flex flex-col justify-around" style={{ height: canvasH }}>
                                {round.matches.map((m) => (
                                    <div key={m.id} className="relative">
                                        <div className="w-full border border-subtle bg-card rounded-xl overflow-hidden shadow-sm opacity-50">
                                            <PlayoffSlot player={m.p1} isTop isR1={rIdx === 0} />
                                            <div className="w-full h-px bg-subtle" />
                                            <PlayoffSlot player={m.p2} isR1={rIdx === 0} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

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

function GroupCard({ group, advanceCount, matchResults, onMatchClick }: { group: any; advanceCount: number; matchResults: Record<string, MatchResult>; onMatchClick: (p1: any, p2: any) => void }) {
    const players: EnginePlayer[] = group.players;

    const matches = useMemo(() => {
        const out: { a: number; b: number }[] = [];
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                out.push({ a: i, b: j });
            }
        }
        return out;
    }, [players]);

    // Считаем победы/поражения для таблицы внутри группы
    const stats = useMemo(() => {
        const s: Record<string, { w: number; l: number }> = {};
        players.forEach(p => { s[p.id] = { w: 0, l: 0 }; });

        matches.forEach(m => {
            const p1 = players[m.a];
            const p2 = players[m.b];
            const mId = getGroupMatchId(group.label, p1.id, p2.id);
            const res = matchResults[mId];
            if (res && res.winnerId) {
                if (s[res.winnerId]) s[res.winnerId].w += 1;
                const loserId = res.winnerId === p1.id ? p2.id : p1.id;
                if (s[loserId]) s[loserId].l += 1;
            }
        });
        return s;
    }, [matches, players, matchResults, group.label]);

    // Сортируем игроков по победам (простой вариант для демо)
    const sortedPlayers = [...players].sort((a, b) => (stats[b.id]?.w || 0) - (stats[a.id]?.w || 0));

    return (
        <div className="rounded-2xl border border-subtle bg-card p-4 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <span className="font-black text-strong text-base flex items-center gap-2">
                    <span className="bg-accent text-accent-foreground rounded-md px-2 py-0.5 text-xs font-black">
                        {group.label}
                    </span>
                    Группа {group.label}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-subtle text-muted px-2 py-0.5 rounded">
                    {players.length} уч.
                </span>
            </div>

            {/* Таблица группы */}
            <div className="space-y-1.5">
                <div className="flex text-[9px] uppercase tracking-widest font-bold text-dim mb-1 px-1">
                    <span className="flex-1">Игрок</span>
                    <span className="w-6 text-center text-accent">В</span>
                    <span className="w-6 text-center">П</span>
                </div>
                {sortedPlayers.map((p, i) => (
                    <div
                        key={p.id}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs ${
                            i < advanceCount ? 'bg-accent/10 border border-accent/20' : 'bg-subtle/30 border border-transparent'
                        }`}
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={`text-[10px] font-mono font-bold w-4 ${i < advanceCount ? 'text-accent' : 'text-dim'}`}>{i + 1}.</span>
                            <span className="text-strong font-semibold truncate">{p.name}</span>
                        </div>
                        <span className="w-6 text-center font-mono font-bold text-accent">{stats[p.id]?.w || 0}</span>
                        <span className="w-6 text-center font-mono text-dim">{stats[p.id]?.l || 0}</span>
                    </div>
                ))}
            </div>

            {/* Матчи группы */}
            <div className="border-t border-subtle pt-3">
                <p className="text-[10px] uppercase tracking-widest font-bold text-dim mb-2">
                    Матчи ({matches.length}) — Кликните для счета
                </p>
                <div className="space-y-1.5">
                    {matches.map((m, idx) => {
                        const a = players[m.a];
                        const b = players[m.b];
                        const mId = getGroupMatchId(group.label, a.id, b.id);
                        const res = matchResults[mId];

                        return (
                            <div
                                key={idx}
                                onClick={() => onMatchClick(a, b)}
                                className="flex flex-col bg-subtle/20 hover:bg-subtle/50 border border-transparent hover:border-accent/40 cursor-pointer rounded-lg px-2.5 py-1.5 transition-colors"
                            >
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className={`font-medium truncate ${res?.winnerId === a.id ? 'text-accent font-bold' : 'text-main'}`}>
                                        {a.name.split(' ')[0]}
                                    </span>
                                    <span className="text-dim text-[9px] font-mono mx-1.5">vs</span>
                                    <span className={`font-medium truncate text-right ${res?.winnerId === b.id ? 'text-accent font-bold' : 'text-main'}`}>
                                        {b.name.split(' ')[0]}
                                    </span>
                                </div>
                                {res && (
                                    <div className="text-center mt-1">
                                        <span className="text-[9px] font-mono font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded border border-accent/20">
                                            {res.scores.map(s => `${s.p1}:${s.p2}`).join(' ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function PlayoffSlot({ player, isTop = false, isR1 = false }: { player: any; isTop?: boolean; isR1?: boolean }) {
    if (!player) return <div className={`px-3 py-2 text-[10px] text-muted italic ${isTop ? 'rounded-t-xl' : 'rounded-b-xl'}`}>Ждёт победителя группы...</div>;

    if (typeof player === 'object' && 'placeholder' in player) {
        return <div className={`px-3 py-2 text-dim text-[11px] font-medium bg-subtle/20 ${isTop ? 'rounded-t-xl' : 'rounded-b-xl'}`}>{player.placeholder}</div>;
    }

    if (typeof player === 'object' && 'name' in player) {
        return (
            <div className={`px-3 py-2 flex items-center gap-2 ${isTop ? 'rounded-t-xl' : 'rounded-b-xl'}`}>
                <span className="bg-accent/15 text-accent border border-accent/30 rounded px-1.5 py-0.5 text-[10px] font-black font-mono">
                    {player.name}
                </span>
            </div>
        );
    }
    return null;
}