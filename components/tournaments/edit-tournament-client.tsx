'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useProgressRouter } from '@/shared/hooks/use-progress-router'
import { TournamentForm } from './tournament-form'
import { TournamentPdfDropzone } from './tournament-pdf-dropzone'
import type { ParsedTournament } from '@/shared/lib/ai/parse-tournament-pdf'
import type { Database } from '@/types/database'

type TournamentRow = Database['public']['Tables']['tournaments']['Row']
type CategoryRow = Database['public']['Tables']['tournament_categories']['Row']

type Props = {
    tournament: TournamentRow & { categories: CategoryRow[] }
}

export function EditTournamentClient({ tournament }: Props) {
    const router = useProgressRouter()
    const [showPdfReplace, setShowPdfReplace] = useState(false)
    const [replacedPdf, setReplacedPdf] = useState<{ url: string; path: string } | null>(null)
    const [replacedData, setReplacedData] = useState<ParsedTournament | null>(null)

    // Разбираем location обратно на city/venue_name/venue_address
    // (простая эвристика: делим по запятым)
    const locationParts = (tournament.location ?? '').split(',').map(s => s.trim())
    const city = locationParts[0] ?? ''
    const venueName = tournament.venue ?? locationParts[1] ?? ''
    const venueAddress = locationParts.slice(2).join(', ') || null

    // Формируем initial data из БД
    const initialData: ParsedTournament = replacedData ?? {
        title: tournament.title,
        organizer: null, // хранится в description, парсить не будем — оставим пусто
        city,
        venue_name: venueName || null,
        venue_address: venueAddress,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        registration_time: null,
        start_time: null,
        awards_time: null,
        registration_deadline: tournament.registration_deadline
            ? tournament.registration_deadline.slice(0, 10)
            : null,
        entry_fee: tournament.entry_fee_amount,
        entry_fee_note: null,
        categories: tournament.categories.map(c => ({
            category: c.category,
            age_group: c.age_group ?? null,
        })),
        description: tournament.description,
        contact_info: null,
    }

    const pdfInfo = replacedPdf ?? (
        tournament.pdf_url && tournament.pdf_storage_path
            ? { url: tournament.pdf_url, path: tournament.pdf_storage_path }
            : null
    )

    return (
        <div className="space-y-6 p-4 pb-8">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => router.push(`/tournaments/${tournament.id}`)}
                    className="rounded-lg p-2 text-muted hover:bg-hover hover:text-strong transition-colors"
                    aria-label="Назад"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-strong">Редактировать</h1>
                    <p className="text-sm text-muted mt-0.5">{tournament.title}</p>
                </div>
            </div>

            {showPdfReplace ? (
                <div className="space-y-3">
                    <TournamentPdfDropzone
                        onParsed={(data, pdf) => {
                            setReplacedData(data)
                            setReplacedPdf(pdf)
                            setShowPdfReplace(false)
                        }}
                        onManual={() => setShowPdfReplace(false)}
                    />
                </div>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => setShowPdfReplace(true)}
                        className="w-full rounded-xl border border-card bg-subtle px-3 py-2.5 text-sm font-medium text-muted hover:border-strong hover:text-strong transition-colors"
                    >
                        📎 Заменить PDF-положение
                    </button>

                    <TournamentForm
                        mode="edit"
                        tournamentId={tournament.id}
                        initialData={initialData}
                        pdfInfo={pdfInfo}
                        onCancel={() => router.push(`/tournaments/${tournament.id}`)}
                    />
                </>
            )}
        </div>
    )
}