'use client'

import { useState, useRef, useCallback } from 'react'
import { FileUp, Loader2, X, FileText, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'
import {
    uploadTournamentPdf,
    parseTournamentPdfAction,
    deleteTournamentPdf,
} from '@/app/(main)/tournaments/actions'
import type { ParsedTournament } from '@/shared/lib/ai/parse-tournament-pdf'

type Props = {
    onParsed: (data: ParsedTournament, pdf: { url: string; path: string }) => void
    onManual: () => void
}

type Stage = 'idle' | 'uploading' | 'parsing' | 'done' | 'error'

export function TournamentPdfDropzone({ onParsed, onManual }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [stage, setStage] = useState<Stage>('idle')
    const [dragActive, setDragActive] = useState(false)
    const [fileName, setFileName] = useState<string | null>(null)

    const handleFile = useCallback(
        async (file: File) => {
            if (file.type !== 'application/pdf') {
                toast.error('Нужен PDF-файл')
                return
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Файл больше 10 МБ')
                return
            }

            setFileName(file.name)
            setStage('uploading')

            const uploadFormData = new FormData()
            uploadFormData.append('pdf', file)

            const uploadResult = await uploadTournamentPdf(uploadFormData)
            if (!uploadResult.success) {
                toast.error(uploadResult.error)
                setStage('error')
                return
            }

            const pdf = uploadResult.data!
            setStage('parsing')

            const parseResult = await parseTournamentPdfAction(pdf.path)
            if (!parseResult.success) {
                toast.error(parseResult.error)
                // Удаляем загруженный PDF, раз парсинг не удался
                await deleteTournamentPdf(pdf.path)
                setStage('error')
                return
            }

            setStage('done')
            toast.success('Данные распознаны — проверь и сохрани')
            onParsed(parseResult.data!, pdf)
        },
        [onParsed]
    )

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleFile(file)
    }

    const reset = () => {
        setStage('idle')
        setFileName(null)
        if (inputRef.current) inputRef.current.value = ''
    }

    const isBusy = stage === 'uploading' || stage === 'parsing'

    return (
        <div className="space-y-3">
            <div
                onDragOver={(e) => {
                    e.preventDefault()
                    setDragActive(true)
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => !isBusy && inputRef.current?.click()}
                className={cn(
                    'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 transition-all',
                    dragActive
                        ? 'border-accent bg-accent-muted'
                        : 'border-card bg-subtle',
                    !isBusy && 'cursor-pointer hover:border-strong'
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleInputChange}
                    disabled={isBusy}
                />

                {stage === 'idle' && (
                    <>
                        <div className="rounded-full bg-accent-muted p-3">
                            <Sparkles className="h-6 w-6 text-accent" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-strong">
                                Загрузи PDF-положение
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                AI автоматически заполнит все поля
                            </p>
                        </div>
                        <Button variant="secondary" size="sm" type="button">
                            <FileUp className="mr-2 h-4 w-4" />
                            Выбрать файл
                        </Button>
                    </>
                )}

                {(stage === 'uploading' || stage === 'parsing') && (
                    <>
                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                        <div className="text-center">
                            <p className="text-sm font-semibold text-strong">
                                {stage === 'uploading' ? 'Загружаю файл…' : 'Распознаю положение…'}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                {fileName}
                            </p>
                            {stage === 'parsing' && (
                                <p className="mt-1 text-xs text-muted">
                                    Обычно занимает 3-5 секунд
                                </p>
                            )}
                        </div>
                    </>
                )}

                {stage === 'done' && (
                    <>
                        <div className="rounded-full bg-success-muted p-3">
                            <FileText className="h-6 w-6 text-success" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-strong">
                                Данные распознаны
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                {fileName}
                            </p>
                        </div>
                    </>
                )}

                {stage === 'error' && (
                    <>
                        <div className="rounded-full bg-danger-muted p-3">
                            <X className="h-6 w-6 text-danger" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-strong">
                                Не удалось распознать
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                Попробуй ещё раз или заполни вручную
                            </p>
                        </div>
                        <Button variant="outline" size="sm" type="button" onClick={reset}>
                            Другой файл
                        </Button>
                    </>
                )}
            </div>

            <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                <span className="text-xs text-muted">или</span>
                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
            </div>

            <Button
                variant="outline"
                fullWidth
                type="button"
                onClick={onManual}
                disabled={isBusy}
                data-tour="tournaments-manual-fill"
            >
                Заполнить вручную
            </Button>
        </div>
    )
}