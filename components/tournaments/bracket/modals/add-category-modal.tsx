'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Category, Discipline, RatingGroup } from '@/shared/types/bracket';

interface Props {
    onClose: () => void;
    onCreate: (cat: Omit<Category, 'id' | 'status'>) => void;
}

const DISCIPLINES: { code: Discipline; desc: string }[] = [
    { code: 'MS', desc: 'Мужская одиночка' },
    { code: 'WS', desc: 'Женская одиночка' },
    { code: 'MD', desc: 'Мужская пара' },
    { code: 'WD', desc: 'Женская пара' },
    { code: 'XD', desc: 'Смешанная пара' },
];

const RATING_GROUPS: { code: RatingGroup; label: string; desc: string }[] = [
    { code: 'A', label: 'A', desc: 'Мастера (900+)' },
    { code: 'B', label: 'B', desc: 'КМС (750-900)' },
    { code: 'C', label: 'C', desc: 'Продвинутые (600-750)' },
    { code: 'D', label: 'D', desc: 'Средний+ (480-600)' },
    { code: 'E', label: 'E', desc: 'Средний (380-480)' },
];

export function AddCategoryModal({ onClose, onCreate }: Props) {
    const [name, setName] = useState<Discipline>('MS');
    const [desc, setDesc] = useState('Мужская одиночка');
    const [ratingGroup, setRatingGroup] = useState<RatingGroup>('C');
    const [count, setCount] = useState(8);

    const handleSubmit = () => {
        onCreate({ name, desc, ratingGroup, count });
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div
                className="bg-[#0A0F1C] border border-subtle rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 border-b border-subtle flex justify-between items-start flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-strong flex items-center gap-2">
                            <Plus className="w-5 h-5 text-accent" /> Новая категория
                        </h3>
                        <p className="text-sm text-muted mt-1">Дисциплина, группа и участники</p>
                    </div>
                    <button onClick={onClose} className="text-muted hover:text-main bg-card p-2 rounded-lg border border-subtle">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                    {/* Дисциплина */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold tracking-widest text-dim uppercase">
                            Дисциплина
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {DISCIPLINES.map((d) => (
                                <button
                                    key={d.code}
                                    onClick={() => {
                                        setName(d.code);
                                        setDesc(d.desc);
                                    }}
                                    className={`p-3 border rounded-xl text-left text-sm transition-colors ${
                                        name === d.code
                                            ? 'border-accent bg-accent/5 text-accent font-bold'
                                            : 'border-subtle bg-card text-muted hover:border-main'
                                    }`}
                                >
                                    <span className="font-bold">{d.code}</span>
                                    <span className="block text-[10px] font-normal mt-0.5 opacity-80">{d.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* НОВОЕ: Рейтинговая категория */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold tracking-widest text-dim uppercase">
                            Категория (Группа)
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {RATING_GROUPS.map((g) => (
                                <button
                                    key={g.code}
                                    onClick={() => setRatingGroup(g.code)}
                                    title={g.desc}
                                    className={`p-3 border rounded-xl text-center transition-colors ${
                                        ratingGroup === g.code
                                            ? 'border-accent bg-accent/5 text-accent font-bold shadow-[0_0_10px_rgba(198,244,50,0.2)]'
                                            : 'border-subtle bg-card text-muted hover:border-main'
                                    }`}
                                >
                                    <span className="text-lg font-black">{g.label}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-dim mt-1">
                            {RATING_GROUPS.find((g) => g.code === ratingGroup)?.desc}
                        </p>
                    </div>

                    {/* Кол-во участников */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold tracking-widest text-dim uppercase">
                            Кол-во участников / пар
                        </label>
                        <input
                            type="number"
                            min={2}
                            max={128}
                            value={count}
                            onChange={(e) => setCount(Math.max(2, parseInt(e.target.value) || 2))}
                            className="w-full bg-card border border-subtle rounded-xl px-4 py-3 text-strong outline-none focus:border-accent"
                        />
                    </div>
                </div>

                <div className="p-5 border-t border-subtle bg-card flex justify-end gap-3 flex-shrink-0">
                    <Button onClick={onClose} variant="ghost" className="text-muted">
                        Отмена
                    </Button>
                    <Button onClick={handleSubmit} className="bg-accent text-accent-foreground font-bold">
                        Создать и настроить сетку
                    </Button>
                </div>
            </div>
        </div>
    );
}