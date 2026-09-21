'use client';

import {useMemo, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Trophy, X} from 'lucide-react';
import type {GameScore, MatchResult} from '@/shared/types/bracket';

interface Props {
    matchId: string;
    p1Name: string;
    p2Name: string;
    p1Id?: string;
    p2Id?: string;
    initialResult?: MatchResult;
    onClose: () => void;
    onSubmit: (result: MatchResult) => void;
}

export function MatchScoreModal({
                                    matchId,
                                    p1Name,
                                    p2Name,
                                    p1Id,
                                    p2Id,
                                    initialResult,
                                    onClose,
                                    onSubmit,
                                }: Props) {
    const [g1, setG1] = useState<GameScore>(initialResult?.scores[0] || { p1: 21, p2: 15 });
    const [g2, setG2] = useState<GameScore>(initialResult?.scores[1] || { p1: 21, p2: 18 });
    const [g3, setG3] = useState<GameScore>(initialResult?.scores[2] || { p1: 0, p2: 0 });

    const [isWalkover, setIsWalkover] = useState(initialResult?.isWalkover || false);
    const [isRetired, setIsRetired] = useState(initialResult?.isRetired || false);
    const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(initialResult?.winnerId || null);

    // Авто-определение победителя по партиям (2 из 3 геймов)
    const computedWinner = useMemo(() => {
        if (selectedWinnerId) return selectedWinnerId;
        if (!p1Id || !p2Id) return null;

        let p1Wins = 0;
        let p2Wins = 0;

        if (g1.p1 > g1.p2) p1Wins++; else if (g1.p2 > g1.p1) p2Wins++;
        if (g2.p1 > g2.p2) p1Wins++; else if (g2.p2 > g2.p1) p2Wins++;
        if (p1Wins === 1 && p2Wins === 1 && (g3.p1 > 0 || g3.p2 > 0)) {
            if (g3.p1 > g3.p2) p1Wins++; else if (g3.p2 > g3.p1) p2Wins++;
        }

        if (p1Wins >= 2) return p1Id;
        if (p2Wins >= 2) return p2Id;
        return null;
    }, [g1, g2, g3, p1Id, p2Id, selectedWinnerId]);

    const handleSave = () => {
        const winner = computedWinner || p1Id || '';
        const scores: GameScore[] = [g1, g2];
        if (g3.p1 > 0 || g3.p2 > 0) scores.push(g3);

        onSubmit({
            winnerId: winner,
            scores,
            isWalkover,
            isRetired,
        });
    };

    return (
        <div className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-card border border-card w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-5">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-muted hover:text-strong rounded-lg hover:bg-hover"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-xl text-accent">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-strong">Ввод счёта матча</h2>
                        <p className="text-xs text-muted">Победитель автоматически проходит в следующий раунд</p>
                    </div>
                </div>

                {/* Соперники */}
                <div className="grid grid-cols-2 gap-3 text-center">
                    <button
                        type="button"
                        onClick={() => p1Id && setSelectedWinnerId(p1Id)}
                        className={`p-3 rounded-xl border transition-all ${
                            computedWinner === p1Id
                                ? 'border-accent bg-accent/15 ring-2 ring-accent/30'
                                : 'border-subtle bg-subtle/30 hover:border-accent/40'
                        }`}
                    >
                        <p className="text-xs font-bold text-strong truncate">{p1Name}</p>
                        {computedWinner === p1Id && (
                            <span className="text-[10px] font-black text-accent uppercase tracking-wider block mt-1">
                                ★ Победитель
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => p2Id && setSelectedWinnerId(p2Id)}
                        className={`p-3 rounded-xl border transition-all ${
                            computedWinner === p2Id
                                ? 'border-accent bg-accent/15 ring-2 ring-accent/30'
                                : 'border-subtle bg-subtle/30 hover:border-accent/40'
                        }`}
                    >
                        <p className="text-xs font-bold text-strong truncate">{p2Name}</p>
                        {computedWinner === p2Id && (
                            <span className="text-[10px] font-black text-accent uppercase tracking-wider block mt-1">
                                ★ Победитель
                            </span>
                        )}
                    </button>
                </div>

                {/* Ввод по партиям (2 из 3 геймов) */}
                <div className="space-y-3 pt-2 border-t border-subtle">
                    <p className="text-[11px] font-bold text-dim uppercase tracking-wider">Счёт по партиям (геймам)</p>

                    {[
                        { label: 'Партия 1', val: g1, set: setG1 },
                        { label: 'Партия 2', label2: 'Партия 2', val: g2, set: setG2 },
                        { label: 'Партия 3 (если 1:1)', val: g3, set: setG3 },
                    ].map((g, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-subtle/30 p-2 rounded-xl text-xs">
                            <span className="text-muted font-medium w-32">{g.label}</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="30"
                                    value={g.val.p1}
                                    onChange={(e) => g.set({ ...g.val, p1: parseInt(e.target.value) || 0 })}
                                    className="w-12 h-8 text-center bg-card border border-subtle rounded-lg font-mono font-bold text-strong"
                                />
                                <span className="text-dim font-bold">:</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="30"
                                    value={g.val.p2}
                                    onChange={(e) => g.set({ ...g.val, p2: parseInt(e.target.value) || 0 })}
                                    className="w-12 h-8 text-center bg-card border border-subtle rounded-lg font-mono font-bold text-strong"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Чекбоксы неявки/снятия */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-subtle text-muted">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isWalkover}
                            onChange={(e) => setIsWalkover(e.target.checked)}
                            className="rounded border-subtle text-accent accent-accent"
                        />
                        <span>Неявка (W/O)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isRetired}
                            onChange={(e) => setIsRetired(e.target.checked)}
                            className="rounded border-subtle text-accent accent-accent"
                        />
                        <span>Снятие (Ret.)</span>
                    </label>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={!computedWinner}
                    className="w-full h-11 bg-accent text-accent-foreground font-bold hover:opacity-90"
                >
                    Сохранить результат и продвинуть
                </Button>
            </div>
        </div>
    );
}