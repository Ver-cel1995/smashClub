'use client';

import { ChevronLeft, FileText, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
    tournamentId: string;
    hasBracket: boolean;
    onClearBracket: () => void;
    onSave: () => void;
    onExportPDF: () => void;
    onExportPNG: () => void;
}

export function BracketHeader({
                                  tournamentId,
                                  hasBracket,
                                  onClearBracket,
                                  onSave,
                                  onExportPDF,
                                  onExportPNG,
                              }: Props) {
    return (
        <header className="h-[60px] flex-shrink-0 bg-card border-b border-card px-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
                <Link
                    href={`/tournaments/${tournamentId}`}
                    className="p-2 hover:bg-hover rounded-lg text-muted transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-strong font-bold text-sm">Управление сетками</h1>
                    <p className="text-[10px] text-dim font-mono tracking-widest uppercase mt-0.5">
                        Кубок Кущёвской 2026
                    </p>
                </div>
            </div>

            <div className="flex justify-end items-center gap-2">
                {hasBracket && (
                    <>
                        <Button
                            onClick={onExportPDF}
                            variant="ghost"
                            className="text-muted hover:text-accent text-xs gap-2"
                        >
                            <FileText className="w-4 h-4" /> PDF
                        </Button>
                        <Button
                            onClick={onExportPNG}
                            variant="ghost"
                            className="text-muted hover:text-accent text-xs gap-2"
                        >
                            <ImageIcon className="w-4 h-4" /> PNG
                        </Button>
                        <div className="w-px h-6 bg-subtle mx-1" />
                        <Button
                            onClick={onClearBracket}
                            variant="ghost"
                            className="text-muted hover:text-danger hover:bg-danger-muted text-xs"
                        >
                            Удалить сетку
                        </Button>
                        <Button
                            onClick={onSave}
                            className="h-9 text-xs font-bold bg-accent text-accent-foreground hover:opacity-90"
                        >
                            Сохранить
                        </Button>
                    </>
                )}
            </div>
        </header>
    );
}