'use client'

import { useState } from 'react'
import { TournamentPdfDropzone } from './tournament-pdf-dropzone'
import { TournamentForm } from './tournament-form'
import type { ParsedTournament } from '@/shared/lib/ai/parse-tournament-pdf'
import { ArrowLeft } from 'lucide-react'
import { useProgressRouter } from '@/shared/hooks/use-progress-router'

type Stage = 'upload' | 'form'

export function NewTournamentClient() {
    const router = useProgressRouter()
    const [stage, setStage] = useState<Stage>('upload')
    const [parsed, setParsed] = useState<ParsedTournament | null>(null)
    const [pdfInfo, setPdfInfo] = useState<{ url: string; path: string } | null>(null)

    return (
        <div className="space-y-6 p-4 pb-8">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => {
                        if (stage === 'form') {
                            setStage('upload')
                            setParsed(null)
                            setPdfInfo(null)
                        } else {
                            router.push('/tournaments')
                        }
                    }}
                    className="rounded-lg p-2 text-muted hover:bg-hover hover:text-strong transition-colors"
                    aria-label="Назад"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-strong">
                        {stage === 'upload' ? 'Новое соревнование' : 'Проверь данные'}
                    </h1>
                    <p className="text-sm text-muted mt-0.5">
                        {stage === 'upload'
                            ? 'Загрузи PDF-положение или заполни вручную'
                            : 'Поправь если что-то распозналось неверно'}
                    </p>
                </div>
            </div>

            {stage === 'upload' && (
                <TournamentPdfDropzone
                    onParsed={(data, pdf) => {
                        setParsed(data)
                        setPdfInfo(pdf)
                        setStage('form')
                    }}
                    onManual={() => {
                        setParsed(null)
                        setPdfInfo(null)
                        setStage('form')
                    }}
                />
            )}

            {stage === 'form' && (
                <TournamentForm
                    initialData={parsed}
                    pdfInfo={pdfInfo}
                    onCancel={() => {
                        setStage('upload')
                        setParsed(null)
                        setPdfInfo(null)
                    }}
                />
            )}
        </div>
    )
}