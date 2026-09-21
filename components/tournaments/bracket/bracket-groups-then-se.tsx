'use client';

import { useMemo } from 'react';
import { Users, Trophy, ChevronRight, GitCommit } from 'lucide-react';
import type { GroupsThenSEData, EnginePlayer } from '@/shared/lib/tournament/bracket-engine';

interface Props {
    data: GroupsThenSEData;
}

const MATCH_BLOCK = 78;

export function BracketGroupsThenSE({ data }: Props) {
    const { groups, playoffRounds, advanceCount } = data;

    const r1Count = playoffRounds[0]?.matchCount || 0;
    const canvasH = Math.max(420, r1Count * MATCH_BLOCK);

    return (
        <div className="p-6 flex flex-col gap-8 overflow-auto min-h-full">
            {/* ЭТАП 1: ГРУППЫ */}
            <section>
                <header className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-accent/10 border border-accent/20 rounded-lg text-accent">
                        <Users className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-strong uppercase tracking-widest">
                            Этап 1 · Групповой (Змейка)
                        </h2>
                        <p className="text-[11px] text-muted">
                            Групп: {groups.length} · Выходят Топ-{advanceCount} из каждой
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {groups.map((g) => (
                        <GroupCard key={g.label} group={g} advanceCount={advanceCount} />
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
                            Этап 2 · Плей-офф (Олимпийка)
                        </h2>
                        <p className="text-[11px] text-muted">
                            {groups.length * advanceCount} участников →{' '}
                            {playoffRounds[playoffRounds.length - 1]?.name || 'Финал'}
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
                                        <span>
                                            {round.name} ({round.matchCount})
                                        </span>
                                    </>
                                )}
                            </div>

                            <div
                                className="flex flex-col justify-around"
                                style={{ height: canvasH }}
                            >
                                {round.matches.map((m) => {
                                    const isR1 = rIdx === 0;

                                    return (
                                        <div key={m.id} className="relative">
                                            <div className="w-full border border-subtle bg-card rounded-xl overflow-hidden shadow-sm hover:border-accent/40 transition-colors">
                                                <PlayoffSlot player={m.p1} isTop isR1={isR1} />
                                                <div className="w-full h-px bg-subtle" />
                                                <PlayoffSlot player={m.p2} isR1={isR1} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function GroupCard({ group, advanceCount }: { group: any; advanceCount: number }) {
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

    return (
        <div className="rounded-2xl border border-subtle bg-card p-3.5 shadow-sm flex flex-col gap-3">
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

            <div className="space-y-1.5">
                {players.map((p, i) => (
                    <div
                        key={'id' in p ? p.id : i}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                            i < advanceCount
                                ? 'bg-accent/10 border border-accent/20'
                                : 'bg-subtle/30'
                        }`}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono font-bold text-dim w-4">
                                {i + 1}.
                            </span>
                            <span className="text-strong font-semibold truncate">{p.name}</span>
                        </div>
                        <span className="text-[10px] text-dim font-mono">{p.rating}</span>
                    </div>
                ))}
            </div>

            <div className="border-t border-subtle pt-2.5">
                <p className="text-[10px] uppercase tracking-widest font-bold text-dim mb-1.5">
                    Матчи в группе ({matches.length})
                </p>
                <div className="space-y-1">
                    {matches.map((m, idx) => {
                        const a = players[m.a];
                        const b = players[m.b];
                        return (
                            <div
                                key={idx}
                                className="flex items-center justify-between bg-subtle/20 rounded px-2 py-1 text-[11px]"
                            >
                                <span className="text-main font-medium truncate">
                                    {a?.name ? a.name.split(' ')[0] : '—'}
                                </span>
                                <span className="text-dim text-[9px] font-mono mx-1.5">vs</span>
                                <span className="text-main font-medium truncate text-right">
                                    {b?.name ? b.name.split(' ')[0] : '—'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="border-t border-subtle pt-2 flex items-center gap-1.5 text-[10px] text-accent uppercase tracking-wider font-bold">
                <ChevronRight className="w-3 h-3" />
                Топ-{advanceCount} → плей-офф
            </div>
        </div>
    );
}

function PlayoffSlot({
                         player,
                         isTop = false,
                         isR1 = false,
                     }: {
    player: any;
    isTop?: boolean;
    isR1?: boolean;
}) {
    if (!player) {
        return (
            <div className={`px-3 py-2.5 text-[11px] text-muted italic ${isTop ? 'rounded-t-xl' : 'rounded-b-xl'}`}>
                Ожидание…
            </div>
        );
    }

    if (player === 'BYE') {
        return (
            <div
                className={`px-3 py-1.5 bg-transparent text-dim text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isTop ? 'rounded-t-xl' : 'rounded-b-xl'
                }`}
            >
                <GitCommit className="w-3 h-3 opacity-60" />
                <span className="opacity-70">BYE</span>
            </div>
        );
    }

    if (typeof player === 'object' && 'placeholder' in player) {
        return (
            <div className={`px-3 py-2.5 text-dim text-[11px] font-medium italic bg-subtle/20 flex items-center gap-2 ${isTop ? 'rounded-t-xl' : 'rounded-b-xl'}`}>
                <span>{player.placeholder}</span>
            </div>
        );
    }

    if (typeof player === 'object' && 'name' in player) {
        if (isR1) {
            return (
                <div
                    className={`px-3 py-2.5 flex items-center gap-2 ${
                        isTop ? 'rounded-t-xl' : 'rounded-b-xl'
                    }`}
                >
                    <span className="bg-accent/15 text-accent border border-accent/30 rounded px-1.5 py-0.5 text-[10px] font-black font-mono">
                        {player.name}
                    </span>
                    <span className="text-[10px] text-dim italic">
                        Победитель группы
                    </span>
                </div>
            );
        }

        return (
            <div className={`px-3 py-2.5 flex flex-col ${isTop ? 'rounded-t-xl' : 'rounded-b-xl'}`}>
                <span className="text-xs font-bold text-strong truncate">{player.name}</span>
                {player.rating > 0 && <span className="text-[9px] text-dim font-mono">Рейтинг: {player.rating}</span>}
            </div>
        );
    }

    return null;
}