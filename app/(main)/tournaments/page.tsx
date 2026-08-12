'use client'

import { useState } from 'react'
import { TournamentPdfDropzone } from '@/components/tournaments/tournament-pdf-dropzone'
import type { ParsedTournament } from '@/shared/lib/ai/parse-tournament-pdf'

export default function TestPdfPage() {
    const [result, setResult] = useState<ParsedTournament | null>(null)
    const [pdfInfo, setPdfInfo] = useState<{ url: string; path: string } | null>(null)

    return (
        <div className="space-y-6 p-4">
            <div>
                <h1 className="text-2xl font-bold text-strong">Тест AI-парсинга PDF</h1>
            </div>

            <TournamentPdfDropzone
                onParsed={(data, pdf) => {
                    setResult(data)
                    setPdfInfo(pdf)
                }}
                onManual={() => alert('чуть позже - как только аишка заработает')}
            />

            {result && (
                <div className="space-y-3 rounded-2xl border border-card bg-card p-4">
                    <h2 className="font-semibold text-strong">Распознанные данные:</h2>
                    <pre className="overflow-x-auto rounded-xl bg-subtle p-3 text-xs text-main">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                    {pdfInfo && (
                        <a
                            href={pdfInfo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-sm text-accent underline"
                        >
                            Открыть загруженный PDF ↗
                        </a>
                    )}
                </div>
            )}
        </div>
    )
}