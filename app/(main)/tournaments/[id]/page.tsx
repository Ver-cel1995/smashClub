import { createClient } from '@/shared/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, MapPin, Calendar } from 'lucide-react'
import type { Database } from '@/types/database'

type TournamentCategoryRow = Database['public']['Tables']['tournament_categories']['Row']

export default async function TournamentPage({
                                                 params,
                                             }: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: tournament } = await supabase
        .from('tournaments')
        .select('*, categories:tournament_categories(*)')
        .eq('id', id)
        .single()

    if (!tournament) notFound()

    const categories = (tournament.categories ?? []) as TournamentCategoryRow[]

    return (
        <div className="space-y-4 p-4 pb-8">
            <Link
                href="/tournaments"
                className="inline-flex items-center gap-2 text-sm text-muted hover:text-strong"
            >
                <ArrowLeft className="h-4 w-4" />
                Все турниры
            </Link>

            <div className="space-y-3 rounded-2xl border border-card bg-card p-4">
                <h1 className="text-xl font-bold text-strong">{tournament.title}</h1>

                <div className="space-y-2 text-sm text-muted">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>{tournament.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>
                            {new Date(tournament.start_date).toLocaleDateString('ru-RU')}
                            {tournament.end_date && ' – ' + new Date(tournament.end_date).toLocaleDateString('ru-RU')}
                        </span>
                    </div>
                </div>

                {tournament.description && (
                    <p className="whitespace-pre-line text-sm text-main">{tournament.description}</p>
                )}

                {tournament.pdf_url && (
                    <a
                        href={tournament.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-accent bg-accent-muted px-3 py-2 text-sm font-semibold text-accent"
                    >
                        <FileText className="h-4 w-4" />
                        Открыть положение
                    </a>
                )}

                {categories.length > 0 && (
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                            Категории
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((c) => (
                                <span
                                    key={c.id}
                                    className="rounded-lg bg-subtle border border-card px-2 py-1 text-xs text-main"
                                >
                                    {c.category}
                                    {c.age_group ? ` · ${c.age_group}` : ''}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}