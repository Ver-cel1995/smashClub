'use client';

import { Search, X, GitCommit } from 'lucide-react';
import type { Participant } from '@/shared/types/bracket';

interface Props {
    player: Participant;
    isTop?: boolean;
    onClick: () => void;
    onClear: (e: React.MouseEvent) => void;
}

export function PlayerSlot({ player, isTop = false, onClick, onClear }: Props) {
    if (player === 'BYE') {
        return (
            <div className={`flex items-center px-4 py-3 bg-subtle/10 opacity-50 ${isTop ? 'rounded-t-xl' : 'rounded-b-xl'}`}>
                <GitCommit className="w-3.5 h-3.5 mr-2 text-muted" />
                <span className="text-[10px] text-dim font-bold tracking-widest uppercase">
                    Проход дальше (BYE)
                </span>
            </div>
        );
    }

    if (player) {
        return (
            <div
                onClick={onClick}
                className={`group/slot relative flex justify-between items-center px-3 py-2.5 bg-card hover:bg-hover cursor-pointer transition-colors ${
                    isTop ? 'rounded-t-xl' : 'rounded-b-xl'
                }`}
            >
                <div className="flex flex-col">
                    <span className="text-sm text-strong font-semibold">{player.name}</span>
                    <span className="text-[10px] text-dim mt-0.5">Рейтинг: {player.rating}</span>
                </div>
                <button
                    onClick={onClear}
                    className="opacity-0 group-hover/slot:opacity-100 text-muted hover:text-danger p-1"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className={`flex items-center px-3 py-3 bg-subtle/10 hover:bg-subtle/50 cursor-pointer transition-colors border border-dashed border-transparent hover:border-accent/50 ${
                isTop ? 'rounded-t-xl' : 'rounded-b-xl'
            }`}
        >
      <span className="text-xs text-accent font-medium flex items-center gap-2 opacity-80 hover:opacity-100">
        <Search className="w-3.5 h-3.5" /> Выбрать...
      </span>
        </div>
    );
}