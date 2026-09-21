'use client';

import { ChevronLeft, FileText, Image as ImageIcon, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
    tournamentId: string;
    hasBracket: boolean;
    isSavingAuto?: boolean;
    onClearBracket: () => void;
    onSave: () => void;
    onExportPDF: () => void;
    onExportPNG: () => void;
}

export function BracketHeader({
                                  tournamentId,
                                  hasBracket,
                                  isSavingAuto,
                                  onClearBracket,
                                  onSave,
                                  onExportPDF,
                                  onExportPNG,
                              }: Props) {
    return (
        <header className="h-[60px] flex-shrink-0 bg-card border-b border-card px-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
                <Link href={`/tournaments/${tournamentId}`} className="p-2 hover:bg-hover rounded-lg text-muted">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-strong font-bold text-sm">Управление турниром</h1>
                    <p className="text-[10px] text-dim font-mono tracking-widest uppercase mt-0.5">
                        {hasBracket ? 'Режим судейства' : 'Конструктор'}
                    </p>
                </div>
            </div>

            <div className="flex justify-end items-center gap-3">
                {hasBracket ? (
                    // РЕЖИМ СУДЕЙСТВА: Автосохранение, экспорт
                    <>
                        <div className="flex items-center gap-2 mr-4 text-xs font-medium text-muted bg-subtle/50 px-3 py-1.5 rounded-lg border border-subtle">
                            {isSavingAuto ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin text-accent" /> Сохранение...</>
                            ) : (
                                <><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Автосохранение включено</>
                            )}
                        </div>
                        <Button onClick={onExportPDF} variant="ghost" className="text-muted hover:text-accent text-xs gap-2">
                            <FileText className="w-4 h-4" /> PDF
                        </Button>
                    </>
                ) : (
                    // РЕЖИМ СОЗДАНИЯ (если мы сбросили сетку)
                    <>
                        <Button onClick={onClearBracket} variant="ghost" className="text-muted hover:text-danger text-xs">
                            Сбросить настройки
                        </Button>
                        <Button onClick={onSave} className="h-9 text-xs font-bold bg-accent text-accent-foreground hover:opacity-90">
                            Сохранить сетку
                        </Button>
                    </>
                )}
            </div>
        </header>
    );
}