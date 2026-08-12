import { createClient } from '@/shared/lib/supabase/server'
import { getCurrentUser } from '@/shared/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function TournamentsPage() {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    const supabase = await createClient()
    const { data: tournaments } = await supabase
        .from('tournaments')
        .select('id, title, location, start_date, end_date, tournament_type, status, pdf_url')
        .order('start_date', { ascending: true })

    const isCoach = user.profile.role === 'coach'

    return (
        <div className="space-y-4 p-4 pb-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-strong">Турниры</h1>
                {isCoach && (
                    <Link href="/tournaments/new">
                        <Button variant="secondary" size="sm">
                            <Plus className="mr-1 h-4 w-4" />
                            Новый
                        </Button>
                    </Link>
                )}
            </div>

            {!tournaments || tournaments.length === 0 ? (
                <div className="rounded-2xl border border-card bg-card p-8 text-center">
                    <p className="text-sm text-muted">Пока нет турниров</p>
                    {isCoach && (
                        <Link href="/tournaments/new" className="mt-3 inline-block text-sm text-accent underline">
                            Создать первый
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {tournaments.map((t) => (
                        <Link
                            key={t.id}
                            href={`/tournaments/${t.id}`}
                            className="block rounded-2xl border border-card bg-card p-4 transition-colors hover:border-strong"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <h2 className="text-base font-semibold text-strong">{t.title}</h2>
                                <span className="shrink-0 text-xs text-muted">
                                    {t.tournament_type === 'home' ? '🏠' : '🚗'}
                                </span>
                            </div>
                            <div className="mt-2 space-y-1 text-xs text-muted">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(t.start_date).toLocaleDateString('ru-RU')}
                                    {t.end_date && ' – ' + new Date(t.end_date).toLocaleDateString('ru-RU')}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3 w-3" />
                                    {t.location}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}