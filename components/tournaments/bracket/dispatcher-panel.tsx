'use client';

import { useState } from 'react';
import { Play, CheckCircle2, Clock, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DispatcherCourt {
    id: number;
    name: string;
    status: 'BUSY' | 'FREE';
    currentMatch?: {
        p1Name: string;
        p2Name: string;
        category: string;
        score: string;
    };
}

export interface QueueMatch {
    id: string;
    category: string;
    p1Name: string;
    p2Name: string;
    roundName: string;
    priorityReason?: string;
}

export function DispatcherPanel() {
    const [courtCount, setCourtCount] = useState<number>(4);

    // Стейт кортов
    const [courts, setCourts] = useState<DispatcherCourt[]>([
        { id: 1, name: 'Корт 1', status: 'BUSY', currentMatch: { p1Name: 'Целикин А.', p2Name: 'Никифоров К.', category: 'MS C (Гр. A)', score: '15:12' } },
        { id: 2, name: 'Корт 2', status: 'BUSY', currentMatch: { p1Name: 'Баранова А.', p2Name: 'Мамонтов П.', category: 'MS C (Гр. B)', score: '11:8' } },
        { id: 3, name: 'Корт 3', status: 'FREE' },
        { id: 4, name: 'Корт 4', status: 'FREE' },
    ]);

    // Очередь следующих матчей к вызову
    const [queue, setQueue] = useState<QueueMatch[]>([
        { id: 'q1', category: 'MS C', roundName: '1/16 финала', p1Name: 'Карпов Фома', p2Name: 'Шилова Аристарх', priorityReason: '⚡ Блокирует следующий раунд' },
        { id: 'q2', category: 'MS C', roundName: 'Группа C.3', p1Name: 'Степанова Г.', p2Name: 'Давыдова А.', priorityReason: '⏱️ Ожидает вызова 25 мин' },
        { id: 'q3', category: 'WD B', roundName: 'Группа A.1', p1Name: 'Михеева М. / Потапова А.', p2Name: 'Фролова К. / Беляева О.' },
    ]);

    // Вызов первого матча на свободный корт
    const handleCallToCourt = (courtId: number) => {
        if (queue.length === 0) return;
        const nextMatch = queue[0];

        setCourts((prev) =>
            prev.map((c) =>
                c.id === courtId
                    ? {
                        ...c,
                        status: 'BUSY',
                        currentMatch: {
                            p1Name: nextMatch.p1Name,
                            p2Name: nextMatch.p2Name,
                            category: `${nextMatch.category} (${nextMatch.roundName})`,
                            score: '0:0',
                        },
                    }
                    : c
            )
        );

        setQueue((prev) => prev.slice(1));
    };

    const handleFinishMatch = (courtId: number) => {
        setCourts((prev) =>
            prev.map((c) => (c.id === courtId ? { ...c, status: 'FREE', currentMatch: undefined } : c))
        );
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* 1. ЖИВОЙ СТАТУС КОРТОВ */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-widest text-strong flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse-slow" />
                        Текущая загрузка кортов ({courts.filter((c) => c.status === 'BUSY').length}/{courts.length})
                    </h2>
                    <span className="text-[11px] text-muted font-mono">Кортов: {courtCount}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {courts.map((court) => (
                        <div
                            key={court.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between h-[150px] ${
                                court.status === 'BUSY'
                                    ? 'bg-card border-accent/40 shadow-sm'
                                    : 'bg-subtle/20 border-dashed border-subtle'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-muted">
                                    {court.name}
                                </span>
                                {court.status === 'BUSY' ? (
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-accent/20 text-accent px-2 py-0.5 rounded border border-accent/30 flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> В игре
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-subtle text-dim px-2 py-0.5 rounded">
                                        Свободен
                                    </span>
                                )}
                            </div>

                            {court.status === 'BUSY' && court.currentMatch ? (
                                <div className="space-y-1 my-auto">
                                    <p className="text-[10px] text-accent font-mono font-bold truncate">
                                        {court.currentMatch.category}
                                    </p>
                                    <p className="text-xs font-bold text-strong truncate leading-tight">
                                        {court.currentMatch.p1Name}
                                    </p>
                                    <p className="text-xs font-bold text-strong truncate leading-tight">
                                        vs {court.currentMatch.p2Name}
                                    </p>
                                </div>
                            ) : (
                                <div className="my-auto text-center py-2">
                                    <p className="text-xs text-dim italic">Нет активного матча</p>
                                </div>
                            )}

                            {court.status === 'BUSY' ? (
                                <Button
                                    size="sm"
                                    onClick={() => handleFinishMatch(court.id)}
                                    className="w-full h-8 text-[11px] font-bold bg-subtle hover:bg-hover text-strong border border-subtle"
                                >
                                    Завершить матч
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    disabled={queue.length === 0}
                                    onClick={() => handleCallToCourt(court.id)}
                                    className="w-full h-8 text-[11px] font-bold bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40"
                                >
                                    <Play className="w-3 h-3 mr-1" /> Вызвать следующий
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 2. ОЧЕРЕДЬ ВЫЗОВА ПО ПРИОРИТЕТУ */}
            <section className="space-y-3 border-t border-subtle pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-widest text-strong flex items-center gap-2">
                        <Clock className="w-4 h-4 text-warning" />
                        Очередь вызова на корт (по приоритету)
                    </h2>
                    <span className="text-[11px] text-muted">В очереди: {queue.length}</span>
                </div>

                <div className="space-y-2">
                    {queue.length === 0 ? (
                        <p className="text-xs text-muted italic py-4 text-center">Все готовые матчи вызваны на корты</p>
                    ) : (
                        queue.map((m, i) => (
                            <div
                                key={m.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-card border border-subtle hover:border-accent/30 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black font-mono text-dim w-6 text-center">
                                        #{i + 1}
                                    </span>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-strong">
                                                {m.p1Name} vs {m.p2Name}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase bg-subtle px-1.5 py-0.5 rounded text-muted">
                                                {m.category} · {m.roundName}
                                            </span>
                                        </div>
                                        {m.priorityReason && (
                                            <span className="text-[10px] text-warning font-semibold mt-0.5">
                                                {m.priorityReason}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={() => {
                                        const freeCourt = courts.find((c) => c.status === 'FREE');
                                        if (freeCourt) handleCallToCourt(freeCourt.id);
                                    }}
                                    disabled={!courts.some((c) => c.status === 'FREE')}
                                    className="h-8 text-xs font-bold bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40"
                                >
                                    Вызвать
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}