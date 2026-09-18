'use client';

import { X, Search } from 'lucide-react';

interface Props {
    participants: { id: string; name: string; rating: number }[];
    selectedIds: Set<string>;
    onClose: () => void;
    onSelect: (p: { id: string; name: string; rating: number }) => void;
}

export function ParticipantSelectorModal({ selectedIds, onClose, onSelect, participants}: Props) {
    return (
        <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-card border border-card rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-subtle bg-subtle/30 flex justify-between">
                    <h3 className="font-bold text-strong">Выберите участника</h3>
                    <X className="w-5 h-5 cursor-pointer text-muted hover:text-main" onClick={onClose} />
                </div>
                <div className="p-3 border-b border-subtle">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Поиск по фамилии..."
                            className="w-full bg-input border border-subtle rounded-lg pl-9 pr-4 py-2 text-sm text-strong focus:border-accent outline-none"
                        />
                    </div>
                </div>
                <div className="overflow-y-auto max-h-[400px] p-2">
                    {participants.map((p) => {
                        const isSelected = selectedIds.has(p.id);
                        return (
                            <button
                                key={p.id}
                                disabled={isSelected}
                                onClick={() => onSelect(p)}
                                className={`w-full flex justify-between items-center p-3 rounded-lg text-left transition-colors ${
                                    isSelected ? 'opacity-30 bg-subtle/10 cursor-not-allowed' : 'hover:bg-hover'
                                }`}
                            >
                                <span className="font-semibold text-sm text-main">
                                  {p.name} {isSelected && '(уже в сетке)'}
                                </span>
                                <span className="text-xs bg-subtle text-muted px-2 py-1 rounded-md font-mono">
                                  {p.rating}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}