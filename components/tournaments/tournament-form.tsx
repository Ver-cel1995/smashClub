'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2, Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { useProgressRouter } from '@/shared/hooks/use-progress-router'
import {
    createTournament,
    updateTournament,
    deleteTournamentPdf,
} from '@/app/(main)/tournaments/actions'
import type { ParsedTournament } from '@/shared/lib/ai/parse-tournament-pdf'

type Props = {
    mode?: 'create' | 'edit'
    tournamentId?: string
    initialData: ParsedTournament | null
    pdfInfo: { url: string; path: string } | null
    onCancel: () => void
}

type FormCategory = { category: 'MS' | 'WS' | 'MD' | 'WD' | 'XD'; age_group: string }

const CATEGORY_LABELS: Record<FormCategory['category'], string> = {
    MS: 'Мужская одиночка',
    WS: 'Женская одиночка',
    MD: 'Мужская пара',
    WD: 'Женская пара',
    XD: 'Смешанная пара',
}

export function TournamentForm({
                                   mode = 'create',
                                   tournamentId,
                                   initialData,
                                   pdfInfo,
                                   onCancel,
                               }: Props) {
    const router = useProgressRouter()
    const [isPending, startTransition] = useTransition()

    const [title, setTitle] = useState(initialData?.title ?? '')
    const [tournamentType, setTournamentType] = useState<'home' | 'away'>('away')
    const [organizer, setOrganizer] = useState(initialData?.organizer ?? '')
    const [city, setCity] = useState(initialData?.city ?? '')
    const [venueName, setVenueName] = useState(initialData?.venue_name ?? '')
    const [venueAddress, setVenueAddress] = useState(initialData?.venue_address ?? '')
    const [startDate, setStartDate] = useState(initialData?.start_date ?? '')
    const [endDate, setEndDate] = useState(initialData?.end_date ?? '')
    const [registrationTime, setRegistrationTime] = useState(initialData?.registration_time ?? '')
    const [startTime, setStartTime] = useState(initialData?.start_time ?? '')
    const [awardsTime, setAwardsTime] = useState(initialData?.awards_time ?? '')
    const [registrationDeadline, setRegistrationDeadline] = useState(
        initialData?.registration_deadline ?? ''
    )
    const [entryFee, setEntryFee] = useState<string>(
        initialData?.entry_fee != null ? String(initialData.entry_fee) : ''
    )
    const [entryFeeNote, setEntryFeeNote] = useState(initialData?.entry_fee_note ?? '')
    const [description, setDescription] = useState(initialData?.description ?? '')
    const [contactInfo, setContactInfo] = useState(initialData?.contact_info ?? '')
    const [categories, setCategories] = useState<FormCategory[]>(
        initialData?.categories.map((c) => ({
            category: c.category,
            age_group: c.age_group ?? '',
        })) ?? []
    )

    const [errors, setErrors] = useState<Record<string, string>>({})

    const addCategory = () => {
        setCategories([...categories, { category: 'MS', age_group: '' }])
    }
    const removeCategory = (idx: number) => {
        setCategories(categories.filter((_, i) => i !== idx))
    }
    const updateCategory = (idx: number, patch: Partial<FormCategory>) => {
        setCategories(categories.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

        startTransition(async () => {
            const payload = {
                title: title.trim(),
                tournament_type: tournamentType,
                organizer: organizer.trim() || null,
                city: city.trim(),
                venue_name: venueName.trim() || null,
                venue_address: venueAddress.trim() || null,
                start_date: startDate,
                end_date: endDate || null,
                registration_time: registrationTime.trim() || null,
                start_time: startTime.trim() || null,
                awards_time: awardsTime.trim() || null,
                registration_deadline: registrationDeadline || null,
                entry_fee: entryFee ? parseInt(entryFee, 10) : null,
                entry_fee_note: entryFeeNote.trim() || null,
                description: description.trim() || null,
                contact_info: contactInfo.trim() || null,
                pdf_url: pdfInfo?.url ?? null,
                pdf_storage_path: pdfInfo?.path ?? null,
                categories: categories.map((c) => ({
                    category: c.category,
                    age_group: c.age_group.trim() || null,
                })),
            }

            const result =
                mode === 'edit' && tournamentId
                    ? await updateTournament(tournamentId, payload)
                    : await createTournament(payload)

            if (result.success) {
                toast.success(mode === 'edit' ? 'Изменения сохранены' : 'Турнир создан')
                router.push(`/tournaments/${result.data!.id}`)
            } else {
                if (result.fieldErrors) setErrors(result.fieldErrors)
                toast.error(result.error)
            }
        })
    }

    const handleCancel = async () => {
        // При create — если был загружен PDF, удаляем его из storage
        // При edit — не удаляем, оставляем как было
        if (mode === 'create' && pdfInfo?.path) {
            await deleteTournamentPdf(pdfInfo.path)
        }
        onCancel()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {pdfInfo && (
                <div className="flex items-center gap-2 rounded-xl border border-accent bg-accent-muted px-3 py-2">
                    <FileText className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-xs text-accent">PDF-положение прикреплено</span>
                    <a
                        href={pdfInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-xs font-semibold text-accent underline"
                    >
                        Открыть
                    </a>
                </div>
            )}

            <Field label="Название *" error={errors.title}>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputCls(errors.title)}
                    placeholder="Открытый кубок Кущёвской"
                />
            </Field>

            <Field label="Тип соревнования">
                <div className="grid grid-cols-2 gap-2">
                    {(['home', 'away'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTournamentType(t)}
                            className={cn(
                                'rounded-xl border px-3 py-2.5 text-sm font-medium transition-all',
                                tournamentType === t
                                    ? 'border-accent bg-accent-muted text-accent'
                                    : 'border-card bg-subtle text-muted hover:border-strong'
                            )}
                        >
                            {t === 'home' ? '🏠 Домашний' : '🚗 Выездной'}
                        </button>
                    ))}
                </div>
            </Field>

            <Field label="Организатор">
                <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className={inputCls()}
                    placeholder="Федерация бадминтона Краснодарского края"
                />
            </Field>

            <div className="space-y-2 rounded-2xl border border-card bg-card p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Место</h3>
                <Field label="Город *" error={errors.city}>
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={inputCls(errors.city)}
                        placeholder="ст. Кущёвская"
                    />
                </Field>
                <Field label="Название зала">
                    <input
                        type="text"
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        className={inputCls()}
                        placeholder="СК Юность"
                    />
                </Field>
                <Field label="Адрес">
                    <input
                        type="text"
                        value={venueAddress}
                        onChange={(e) => setVenueAddress(e.target.value)}
                        className={inputCls()}
                        placeholder="ул. Мира, 70"
                    />
                </Field>
            </div>

            <div className="space-y-2 rounded-2xl border border-card bg-card p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Даты</h3>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Начало *" error={errors.start_date}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={inputCls(errors.start_date)}
                        />
                    </Field>
                    <Field label="Окончание">
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={inputCls()}
                        />
                    </Field>
                </div>
                <Field label="Дедлайн регистрации">
                    <input
                        type="date"
                        value={registrationDeadline}
                        onChange={(e) => setRegistrationDeadline(e.target.value)}
                        className={inputCls()}
                    />
                </Field>
            </div>

            <div className="space-y-2 rounded-2xl border border-card bg-card p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Расписание дня</h3>
                <Field label="Регистрация / мандатная комиссия">
                    <input
                        type="text"
                        value={registrationTime}
                        onChange={(e) => setRegistrationTime(e.target.value)}
                        className={inputCls()}
                        placeholder="09:00-10:00"
                    />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Начало игр">
                        <input
                            type="text"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className={inputCls()}
                            placeholder="10:30"
                        />
                    </Field>
                    <Field label="Награждение">
                        <input
                            type="text"
                            value={awardsTime}
                            onChange={(e) => setAwardsTime(e.target.value)}
                            className={inputCls()}
                            placeholder="15:00"
                        />
                    </Field>
                </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-card bg-card p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Взнос</h3>
                <Field label="Сумма (₽)">
                    <input
                        type="number"
                        value={entryFee}
                        onChange={(e) => setEntryFee(e.target.value)}
                        className={inputCls()}
                        placeholder="500"
                        min="0"
                    />
                </Field>
                <Field label="Пояснение (если разные суммы)">
                    <input
                        type="text"
                        value={entryFeeNote}
                        onChange={(e) => setEntryFeeNote(e.target.value)}
                        className={inputCls()}
                        placeholder="500₽ одиночка, 800₽ пара"
                    />
                </Field>
            </div>

            <div className="space-y-2 rounded-2xl border border-card bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Категории * ({categories.length})
                    </h3>
                    <button
                        type="button"
                        onClick={addCategory}
                        className="flex items-center gap-1 text-xs font-semibold text-accent hover:opacity-80"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Добавить
                    </button>
                </div>

                {categories.length === 0 && (
                    <p className="text-xs text-muted italic py-2">Добавь хотя бы одну категорию</p>
                )}

                <div className="space-y-2">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-xl bg-subtle p-2">
                            <select
                                value={cat.category}
                                onChange={(e) =>
                                    updateCategory(idx, {
                                        category: e.target.value as FormCategory['category'],
                                    })
                                }
                                className={cn(inputCls(), 'w-auto min-w-[140px]')}
                            >
                                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={cat.age_group}
                                onChange={(e) => updateCategory(idx, { age_group: e.target.value })}
                                className={cn(inputCls(), 'flex-1')}
                                placeholder="до 11 лет / взрослые"
                            />
                            <button
                                type="button"
                                onClick={() => removeCategory(idx)}
                                className="rounded-lg p-2 text-danger hover:bg-danger-muted transition-colors"
                                aria-label="Удалить"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
                {errors.categories && <p className="text-xs text-danger mt-1">{errors.categories}</p>}
            </div>

            <Field label="Описание / условия допуска">
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={cn(inputCls(), 'min-h-24 resize-y')}
                    placeholder="К соревнованиям допускаются спортсмены..."
                    rows={4}
                />
            </Field>

            <Field label="Контакты">
                <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className={inputCls()}
                    placeholder="Иванов И.И., +7 999 123-45-67"
                />
            </Field>

            <div className="flex flex-col gap-2 pt-2">
                <Button type="submit" variant="secondary" fullWidth disabled={isPending}>
                    {isPending
                        ? mode === 'edit' ? 'Сохраняем…' : 'Создаём…'
                        : mode === 'edit' ? 'Сохранить изменения' : 'Создать турнир'}
                </Button>
                <Button type="button" variant="ghost" fullWidth onClick={handleCancel} disabled={isPending}>
                    Отмена
                </Button>
            </div>
        </form>
    )
}

function Field({
                   label,
                   children,
                   error,
               }: {
    label: string
    children: React.ReactNode
    error?: string
}) {
    return (
        <label className="block">
            <span className="text-xs font-medium text-muted mb-1 block">{label}</span>
            {children}
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </label>
    )
}

function inputCls(error?: string) {
    return cn(
        'w-full rounded-xl border bg-input px-3 py-2.5 text-sm text-main placeholder:text-dim',
        'focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/40 focus:border-accent',
        error ? 'border-danger' : 'border-card'
    )
}