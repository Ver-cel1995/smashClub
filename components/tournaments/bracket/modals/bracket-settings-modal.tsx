'use client';

import { useState } from 'react';
import { X, Settings2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Category, BracketFormat, SeedingType } from '@/shared/types/bracket';

interface Props {
    category: Category;
    onClose: () => void;
    onGenerate: (format: BracketFormat, seeding: SeedingType) => void;
}

export function BracketSettingsModal({ category, onClose, onGenerate }: Props) {
    const [bracketFormat, setBracketFormat] = useState<BracketFormat>('SE');
    const [seedingType, setSeedingType] = useState<SeedingType>('SNAKE');

    const bracketSize = (() => {
        let s = 1;
        while (s < category.count) s *= 2;
        return s;
    })();
    const byesCount = bracketSize - category.count;

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0A0F1C] border border-subtle rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
                <div className="p-5 border-b border-subtle flex justify-between items-start flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-strong flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-accent" /> Настройки сетки
                        </h3>
                        <p className="text-sm text-accent mt-1">
                            {category.desc} ({category.name}) · Группа {category.ratingGroup} · {category.count} уч.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-muted hover:text-main bg-card p-2 rounded-lg border border-subtle">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Формат */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold tracking-widest text-dim uppercase">
                            Формат турнира
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setBracketFormat('SE')}
                                className={`p-3 border text-left rounded-xl text-sm font-bold transition-colors ${
                                    bracketFormat === 'SE'
                                        ? 'border-accent bg-accent/5 text-accent'
                                        : 'border-subtle bg-card text-muted hover:border-main'
                                }`}
                            >
                                🏆 Олимпийка
                                <span className="block text-[10px] font-normal mt-1 opacity-80">На вылет</span>
                            </button>
                            <button
                                onClick={() => setBracketFormat('RR')}
                                className={`p-3 border text-left rounded-xl text-sm font-bold transition-colors ${
                                    bracketFormat === 'RR'
                                        ? 'border-accent bg-accent/5 text-accent'
                                        : 'border-subtle bg-card text-muted hover:border-main'
                                }`}
                            >
                                🔄 Круговая
                                <span className="block text-[10px] font-normal mt-1 opacity-80">Каждый с каждым</span>
                            </button>
                        </div>
                    </div>

                    {bracketFormat === 'SE' && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold tracking-widest text-dim uppercase">
                                Посев (Seeding)
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm text-strong cursor-pointer">
                                    <input
                                        type="radio"
                                        name="seed"
                                        checked={seedingType === 'SNAKE'}
                                        onChange={() => setSeedingType('SNAKE')}
                                        className="accent-accent"
                                    />
                                    Змейка (рейтинг)
                                </label>
                                <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                                    <input
                                        type="radio"
                                        name="seed"
                                        checked={seedingType === 'RANDOM'}
                                        onChange={() => setSeedingType('RANDOM')}
                                        className="accent-accent"
                                    />
                                    Случайный
                                </label>
                            </div>
                            <div className="bg-subtle/30 border border-subtle p-3 rounded-xl flex gap-3">
                                <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] text-muted leading-relaxed">
                                    Сетка на {bracketSize} слотов.{' '}
                                    {byesCount > 0
                                        ? `Автоматически ${byesCount} пустых мест (BYE).`
                                        : 'Все слоты заняты участниками.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {bracketFormat === 'RR' && (
                        <div className="bg-subtle/30 border border-subtle p-3 rounded-xl flex gap-3">
                            <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-muted leading-relaxed">
                                Круговая система: каждый играет с каждым. Всего матчей:{' '}
                                <strong className="text-main">{(category.count * (category.count - 1)) / 2}</strong>.
                                Идеально для 4–10 участников.
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-subtle bg-card flex justify-end gap-3 flex-shrink-0">
                    <Button onClick={onClose} variant="ghost" className="text-muted">
                        Отмена
                    </Button>
                    <Button
                        onClick={() => onGenerate(bracketFormat, seedingType)}
                        className="bg-accent text-accent-foreground font-bold"
                    >
                        {bracketFormat === 'SE' ? 'Сгенерировать олимпийку' : 'Сгенерировать круговую'}
                    </Button>
                </div>
            </div>
        </div>
    );
}