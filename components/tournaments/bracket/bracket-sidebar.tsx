'use client';

import { useState } from 'react';
import { Plus, Trash2, Filter, Eraser, AlertTriangle, CheckCircle2, Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Category, BracketState } from '@/shared/types/bracket';

interface Props {
    categories: Category[];
    activeCategory: string | null;
    brackets: Record<string, BracketState>;
    onSelectCategory: (id: string) => void;
    onDeleteCategory: (id: string, e: React.MouseEvent) => void;
    onEditCategory: (id: string, e: React.MouseEvent) => void; // ← НОВЫЙ ПРОП
    onDeleteEmptyCategories?: () => void;
    onAddCategory: () => void;
}

export function BracketSidebar({
                                   categories,
                                   activeCategory,
                                   brackets,
                                   onSelectCategory,
                                   onDeleteCategory,
                                   onEditCategory,
                                   onDeleteEmptyCategories,
                                   onAddCategory,
                               }: Props) {
    const [hideEmpty, setHideEmpty] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

    const emptyCount = categories.filter((c) => c.count === 0).length;
    const displayedCategories = hideEmpty ? categories.filter((c) => c.count > 0) : categories;

    const readyCategories = displayedCategories.filter(c => brackets[c.id]);
    const draftCategories = displayedCategories.filter(c => !brackets[c.id]);

    const handleDeleteClick = (cat: Category, e: React.MouseEvent) => {
        e.stopPropagation();
        setCategoryToDelete({ id: cat.id, name: `${cat.name} (Группа ${cat.ratingGroup})` });
    };

    const confirmDelete = (e: React.MouseEvent) => {
        if (categoryToDelete) {
            onDeleteCategory(categoryToDelete.id, e);
            setCategoryToDelete(null);
        }
    };

    const renderCategory = (cat: Category, isReady: boolean) => (
        <div
            key={cat.id}
            className={`group flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                activeCategory === cat.id
                    ? 'border-accent bg-accent/10 shadow-[inset_3px_0_0_#C6F432]'
                    : 'border-subtle bg-subtle/20 hover:border-main hover:bg-subtle/40'
            }`}
            onClick={() => onSelectCategory(cat.id)}
        >
            <div className="flex justify-between items-center w-full mb-1">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-strong text-sm">{cat.name}</span>
                    <span className="text-[10px] bg-subtle text-accent border border-accent/20 px-1.5 py-0.5 rounded font-mono font-bold">
                        {cat.ratingGroup}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {isReady && (
                        <span className="text-[10px] bg-success/15 text-success px-1.5 py-0.5 rounded flex items-center gap-1 mr-1">
                            <CheckCircle2 className="w-3 h-3" />
                        </span>
                    )}
                    {/* ⚙️ КНОПКА РЕДАКТИРОВАНИЯ СЕТКИ */}
                    {isReady && (
                        <button
                            type="button"
                            onClick={(e) => onEditCategory(cat.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-accent hover:bg-accent/10 rounded transition-all"
                            title="Изменить настройки сетки"
                        >
                            <Settings className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(e) => handleDeleteClick(cat, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-danger hover:bg-danger/10 rounded transition-all"
                        title="Удалить категорию"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            <span className="text-xs text-muted">
                {cat.desc} · <strong className={cat.count > 0 ? "text-accent" : "text-dim"}>{cat.count} уч.</strong>
            </span>
        </div>
    );

    return (
        <>
            <aside className="w-[320px] bg-card border-r border-card flex flex-col p-4 z-10 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold text-dim tracking-widest uppercase">
                        Категории ({categories.length})
                    </h2>

                    <button
                        type="button"
                        onClick={() => setHideEmpty(!hideEmpty)}
                        className={`p-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-all ${
                            hideEmpty
                                ? 'bg-accent/15 border-accent text-accent'
                                : 'bg-subtle/30 border-subtle text-muted hover:text-strong'
                        }`}
                        title="Скрыть категории без участников"
                    >
                        <Filter className="w-3 h-3" />
                        {hideEmpty ? 'Только с уч.' : 'Все'}
                    </button>
                </div>

                {emptyCount > 0 && !hideEmpty && onDeleteEmptyCategories && (
                    <button
                        type="button"
                        onClick={onDeleteEmptyCategories}
                        className="mb-3 w-full py-1.5 px-2.5 bg-danger/10 border border-danger/20 hover:bg-danger/20 text-danger rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <Eraser className="w-3.5 h-3.5" />
                        Удалить пустые ({emptyCount})
                    </button>
                )}

                <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-6">
                    {readyCategories.length > 0 && (
                        <div className="space-y-2.5">
                            <h2 className="text-[10px] font-bold text-success tracking-widest uppercase flex items-center gap-1.5 px-1">
                                <CheckCircle2 className="w-3 h-3" /> Готовые ({readyCategories.length})
                            </h2>
                            <div className="flex flex-col gap-2">
                                {readyCategories.map(c => renderCategory(c, true))}
                            </div>
                        </div>
                    )}

                    {draftCategories.length > 0 && (
                        <div className="space-y-2.5">
                            <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase flex items-center gap-1.5 px-1">
                                <Clock className="w-3 h-3" /> Требуют настройки ({draftCategories.length})
                            </h2>
                            <div className="flex flex-col gap-2">
                                {draftCategories.map(c => renderCategory(c, false))}
                            </div>
                        </div>
                    )}
                </div>

                <Button
                    onClick={onAddCategory}
                    variant="ghost"
                    className="mt-4 w-full border border-dashed border-subtle text-muted hover:text-strong hover:bg-hover hover:border-main flex gap-2 h-10 shrink-0"
                >
                    <Plus className="w-4 h-4" /> Добавить категорию
                </Button>
            </aside>

            {categoryToDelete && (
                <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-card border border-card w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto text-danger">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-strong">Удалить категорию?</h3>
                            <p className="text-xs text-muted">
                                Вы действительно хотите удалить <strong className="text-strong">{categoryToDelete.name}</strong>? Все сетки этой категории будут удалены из базы.
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setCategoryToDelete(null)} className="flex-1 border-subtle">
                                Отмена
                            </Button>
                            <Button type="button" onClick={confirmDelete} className="flex-1 bg-danger text-white hover:bg-danger/90 font-bold">
                                Удалить
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}