'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Trophy, GitBranch, Repeat, ShieldAlert } from 'lucide-react';
import type { Category, SeedingType } from '@/shared/types/bracket';

type ExtendedFormat = 'SE' | 'RR' | 'RR_THEN_SE' | 'APP12';

interface Props {
    category: Category;
    onClose: () => void;
    onGenerate: (format: ExtendedFormat, seeding: SeedingType, groupCount?: number, autoSeed?: boolean) => void;
}

export function BracketSettingsModal({ category, onClose, onGenerate }: Props) {
    const [format, setFormat] = useState<ExtendedFormat>('SE');
    const [seeding, setSeeding] = useState<SeedingType>('SNAKE');
    const [groupCount, setGroupCount] = useState<number>(4);
    const [autoSeed, setAutoSeed] = useState<boolean>(true);

    return (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-card w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-muted hover:text-strong rounded-lg hover:bg-hover transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-xl text-accent">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-strong">Настройка сетки</h2>
                        <p className="text-xs text-muted">
                            {category.name} · Группа {category.ratingGroup} ({category.count} уч.)
                        </p>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* ФОРМАТ ТУРНИРА */}
                    <div>
                        <label className="text-xs font-bold text-dim uppercase tracking-wider block mb-2">
                            Формат турнира
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'SE', label: 'Олимпийка', desc: 'Приложение 11', icon: GitBranch },
                                { id: 'RR', label: 'Круговая', desc: 'Каждый с каждым', icon: Repeat },
                                { id: 'RR_THEN_SE', label: 'Группы → Сетка', desc: 'Разминка в группах', icon: Trophy },
                                { id: 'APP12', label: 'Длинная сетка', desc: 'Приложение 12 (3-е место)', icon: ShieldAlert },
                            ].map((item) => {
                                const Icon = item.icon;
                                const active = format === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setFormat(item.id as ExtendedFormat)}
                                        className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                                            active
                                                ? 'border-accent bg-accent/10 text-accent'
                                                : 'border-subtle bg-subtle/30 text-muted hover:text-strong hover:bg-subtle'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icon className="w-4 h-4 shrink-0" />
                                            <span className="text-xs font-bold leading-tight">{item.label}</span>
                                        </div>
                                        <span className="text-[10px] text-dim">{item.desc}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* НАСТРОЙКИ ГРУПП (ЕСЛИ ВЫБРАН ФОРМАТ С ГРУППАМИ) */}
                    {format === 'RR_THEN_SE' && (
                        <div className="p-3.5 bg-subtle/30 border border-subtle rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-strong">Количество групп:</span>
                                <div className="flex items-center gap-2">
                                    {[2, 4, 8].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => setGroupCount(num)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                                groupCount === num
                                                    ? 'bg-accent text-accent-foreground'
                                                    : 'bg-subtle text-muted hover:text-strong'
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* МЕТОД ПОСЕВА */}
                    <div>
                        <label className="text-xs font-bold text-dim uppercase tracking-wider block mb-2">
                            Метод посева (Seeding)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'SNAKE', label: 'Змейка', desc: 'Равный баланс' },
                                { id: 'UNIFORM', label: 'Равномерный', desc: 'По слоям' },
                                { id: 'RATING', label: 'По рейтингу', desc: 'BWF Сетка' },
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setSeeding(s.id as SeedingType)}
                                    className={`p-2.5 rounded-xl border text-center transition-all ${
                                        seeding === s.id
                                            ? 'border-accent bg-accent/10 text-accent font-bold'
                                            : 'border-subtle bg-subtle/20 text-muted hover:text-strong'
                                    }`}
                                >
                                    <p className="text-xs">{s.label}</p>
                                    <p className="text-[9px] text-dim">{s.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ЧЕКБОКС АВТОПОСЕВА */}
                    <label className="flex items-center gap-3 p-3 bg-subtle/20 border border-subtle rounded-xl cursor-pointer hover:bg-subtle/40 transition-colors">
                        <input
                            type="checkbox"
                            checked={autoSeed}
                            onChange={(e) => setAutoSeed(e.target.checked)}
                            className="w-4 h-4 rounded border-subtle text-accent focus:ring-accent accent-accent"
                        />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-strong flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-accent" />
                                Автоматически расставить участников
                            </span>
                            <span className="text-[10px] text-dim">
                                Заполнить слоты игроками с высшим рейтингом и расставить BYE
                            </span>
                        </div>
                    </label>

                    <Button
                        onClick={() => onGenerate(format, seeding, groupCount, autoSeed)}
                        className="w-full h-11 bg-accent text-accent-foreground font-bold hover:opacity-90 shadow-lg"
                    >
                        Сгенерировать сетку
                    </Button>
                </div>
            </div>
        </div>
    );
}