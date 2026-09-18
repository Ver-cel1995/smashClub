'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Category, BracketState } from '@/shared/types/bracket';

interface Props {
    categories: Category[];
    activeCategory: string | null;
    brackets: Record<string, BracketState>; // хранилище сеток по ID категории
    onSelectCategory: (id: string) => void;
    onDeleteCategory: (id: string, e: React.MouseEvent) => void;
    onAddCategory: () => void;
}

export function BracketSidebar({
                                   categories,
                                   activeCategory,
                                   brackets,
                                   onSelectCategory,
                                   onDeleteCategory,
                                   onAddCategory,
                               }: Props) {
    return (
        <aside className="w-[300px] bg-card border-r border-card flex flex-col p-5 z-10 shadow-xl">
            <h2 className="text-xs font-bold text-dim mb-5 tracking-widest uppercase">Категории</h2>

            <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                {categories.map((cat) => {
                    const hasBracket = !!brackets[cat.id];
                    return (
                        <div
                            key={cat.id}
                            className={`group flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all ${
                                activeCategory === cat.id
                                    ? 'border-accent bg-accent/5 shadow-[inset_3px_0_0_#C6F432]'
                                    : 'border-subtle bg-app hover:border-main'
                            }`}
                            onClick={() => onSelectCategory(cat.id)}>
                            <div className="flex justify-between items-center w-full mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-strong">{cat.name}</span>
                                    <span className="text-[10px] bg-subtle text-muted px-1.5 py-0.5 rounded font-mono font-bold">
                                        {cat.ratingGroup}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {hasBracket && (
                                        <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                                            Готова
                                        </span>
                                    )}
                                    <button
                                        onClick={(e) => onDeleteCategory(cat.id, e)}
                                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-opacity"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <span className="text-xs text-muted">
                                {cat.desc} · {cat.count} уч.
                                {brackets[cat.id]?.format === 'RR' && ' · Круговая'}
                                {brackets[cat.id]?.format === 'SE' && ' · Олимпийка'}
                            </span>
                        </div>
                    );
                })}
            </div>

            <Button
                onClick={onAddCategory}
                variant="ghost"
                className="mt-5 w-full border border-dashed border-subtle text-muted hover:text-strong hover:bg-hover hover:border-main flex gap-2"
            >
                <Plus className="w-4 h-4" /> Добавить категорию
            </Button>
        </aside>
    );
}