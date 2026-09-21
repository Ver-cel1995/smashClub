'use client';

import { useState, useMemo } from 'react';
import { Search, X, UserCheck } from 'lucide-react';

interface ParticipantItem {
    id: string;
    name: string;
    rating: number;
}

interface Props {
    participants: ParticipantItem[];
    selectedIds: Set<string>;
    onClose: () => void;
    onSelect: (participant: ParticipantItem) => void;
}

export function ParticipantSelectorModal({
                                             participants,
                                             selectedIds,
                                             onClose,
                                             onSelect,
                                         }: Props) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search.trim()) return participants;
        const q = search.toLowerCase().trim();
        return participants.filter((p) => p.name.toLowerCase().includes(q));
    }, [participants, search]);

    return (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-card w-full max-w-md rounded-2xl p-5 shadow-2xl relative flex flex-col max-h-[80vh]">

                {/* Хедер */}
                <div className="flex items-center justify-between pb-3 border-b border-subtle mb-3">
                    <div>
                        <h2 className="text-base font-bold text-strong">Выберите участника</h2>
                        <p className="text-[11px] text-muted">Доступно для выбора: {participants.length}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-muted hover:text-strong rounded-lg hover:bg-hover transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Поиск */}
                <div className="relative mb-3">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по фамилии..."
                        className="w-full bg-subtle/50 border border-subtle rounded-xl pl-9 pr-4 py-2 text-sm text-strong placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                        autoFocus
                    />
                </div>

                {/* Список участников */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {filtered.length === 0 ? (
                        <div className="text-center py-8 text-xs text-muted">
                            {participants.length === 0
                                ? 'В этой категории нет зарегистрированных участников'
                                : 'Никто не найден по вашему запросу'}
                        </div>
                    ) : (
                        filtered.map((p) => {
                            const isSelected = selectedIds.has(p.id);
                            return (
                                <button
                                    key={p.id}
                                    disabled={isSelected}
                                    onClick={() => onSelect(p)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                        isSelected
                                            ? 'bg-subtle/20 border-subtle/30 opacity-50 cursor-not-allowed'
                                            : 'bg-subtle/40 border-subtle hover:border-accent hover:bg-accent/10 cursor-pointer'
                                    }`}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-strong leading-tight">
                                            {p.name}
                                        </span>
                                        <span className="text-[10px] text-dim font-mono mt-0.5">
                                            Рейтинг: {p.rating}
                                        </span>
                                    </div>

                                    {isSelected ? (
                                        <span className="text-[10px] font-bold text-muted bg-subtle px-2 py-0.5 rounded flex items-center gap-1">
                                            <UserCheck className="w-3 h-3" /> В сетке
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold text-accent">
                                            Выбрать →
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}