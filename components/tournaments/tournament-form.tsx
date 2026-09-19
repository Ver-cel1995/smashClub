'use client'

import {useState, useTransition} from 'react'
import {toast} from 'sonner'
import {Check, FileText} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {cn} from '@/shared/lib/utils'
import {useProgressRouter} from '@/shared/hooks/use-progress-router'
import {createTournament, updateTournament,} from '@/app/(main)/tournaments/actions'
import type {ParsedTournament} from '@/shared/lib/ai/parse-tournament-pdf'

type Props = {
    mode?: 'create' | 'edit'
    tournamentId?: string
    initialData: ParsedTournament | null
    pdfInfo: { url: string; path: string } | null
    onCancel?: () => void
}

type Discipline = 'MS' | 'WS' | 'MD' | 'WD' | 'XD'
type RatingGroup = 'A' | 'B' | 'C' | 'D' | 'E'

const ALL_DISCIPLINES: { code: Discipline; label: string }[] = [
    { code: 'MS', label: 'Мужская одиночка (MS)' },
    { code: 'WS', label: 'Женская одиночка (WS)' },
    { code: 'MD', label: 'Мужская пара (MD)' },
    { code: 'WD', label: 'Женская пара (WD)' },
    { code: 'XD', label: 'Смешанная пара (XD)' },
]

const ALL_RATING_GROUPS: { code: RatingGroup; label: string; hint: string }[] = [
    { code: 'A', label: 'Группа A', hint: '900+' },
    { code: 'B', label: 'Группа B', hint: '750–900' },
    { code: 'C', label: 'Группа C', hint: '600–750' },
    { code: 'D', label: 'Группа D', hint: '480–600' },
    { code: 'E', label: 'Группа E', hint: '380–480' },
]

function stripAwardsFromDescription(desc: string | null | undefined): string {
    if (!desc) return ''
    return desc
        .replace(/\n*\s*🏆\s*Награды\s*\n?[\s\S]*$/i, '')
        .replace(/\n*\s*Награды\s*:\s*[\s\S]*$/i, '')
        .trim()
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

    // ПРОСТАЯ инициализация, без коллбеков () => ...
    const defaultDisciplines: Discipline[] = initialData?.categories?.length
        ? Array.from(new Set(initialData.categories.map((c) => c.category as Discipline)))
        : ['MS', 'MD', 'XD']

    const defaultGroups: RatingGroup[] = initialData?.categories?.length
        ? Array.from(
            new Set(
                initialData.categories.map((c) => {
                    const g = c.age_group?.replace(/^Группа\s+/i, '').trim().toUpperCase() || 'C'
                    return ['A', 'B', 'C', 'D', 'E'].includes(g) ? (g as RatingGroup) : 'C'
                })
            )
        )
        : ['C']

    const [title, setTitle] = useState(initialData?.title ?? '')
    const [organizer, setOrganizer] = useState(initialData?.organizer ?? '')
    const [city, setCity] = useState(initialData?.city ?? '')
    const [venueName, setVenueName] = useState(initialData?.venue_name ?? '')
    const [venueAddress, setVenueAddress] = useState(initialData?.venue_address ?? '')
    const [startDate, setStartDate] = useState(initialData?.start_date ?? '')
    const [endDate, setEndDate] = useState(initialData?.end_date ?? '')
    const [registrationTime, setRegistrationTime] = useState(initialData?.registration_time ?? '')
    const [startTime, setStartTime] = useState(initialData?.start_time ?? '')
    const [awards, setAwards] = useState(initialData?.awards ?? '')
    const [registrationDeadline, setRegistrationDeadline] = useState(
        initialData?.registration_deadline ?? ''
    )

    const [feeMode, setFeeMode] = useState<'uniform' | 'per_discipline'>('uniform')
    const [uniformFee, setUniformFee] = useState<string>(
        initialData?.entry_fee != null ? String(initialData.entry_fee) : '500'
    )
    const [customFees, setCustomFees] = useState<Record<Discipline, string>>({
        MS: '500', WS: '500', MD: '800', WD: '800', XD: '800',
    })

    // Независимые стейты Дисциплин и Групп
    const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>(defaultDisciplines)
    const [selectedGroups, setSelectedGroups] = useState<RatingGroup[]>(defaultGroups)

    const [description, setDescription] = useState(
        stripAwardsFromDescription(initialData?.description)
    )
    const [contactInfo, setContactInfo] = useState(initialData?.contact_info ?? '')
    const [errors, setErrors] = useState<Record<string, string>>({})

    const toggleDiscipline = (code: Discipline) => {
        setSelectedDisciplines((prev) =>
            prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code]
        )
    }

    const toggleGroup = (code: RatingGroup) => {
        setSelectedGroups((prev) =>
            prev.includes(code) ? prev.filter((g) => g !== code) : [...prev, code]
        )
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

        if (!title.trim()) {
            setErrors({ title: 'Укажите название' })
            toast.error('Укажите название')
            return
        }
        if (!city.trim()) {
            setErrors({ city: 'Укажите город' })
            toast.error('Укажите город')
            return
        }
        if (!startDate) {
            setErrors({ start_date: 'Укажите дату начала' })
            toast.error('Укажите дату начала')
            return
        }
        if (registrationDeadline && startDate && registrationDeadline > startDate) {
            setErrors({ registration_deadline: 'Дедлайн не может быть позже даты начала' })
            toast.error('Дедлайн не может быть позже даты начала')
            return
        }
        if (selectedDisciplines.length === 0) {
            toast.error('Выберите хотя бы одну дисциплину')
            return
        }
        if (selectedGroups.length === 0) {
            toast.error('Выберите хотя бы одну категорию рейтинга (A-E)')
            return
        }

        startTransition(async () => {
            // Кросс-джоин: MS+C, MD+C, XD+C, MS+D...
            const finalCategories = []
            for (const disc of selectedDisciplines) {
                for (const grp of selectedGroups) {
                    finalCategories.push({
                        category: disc,
                        age_group: `Группа ${grp}`,
                    })
                }
            }

            const feeNote =
                feeMode === 'per_discipline'
                    ? selectedDisciplines
                        .map((d) => `${d}: ${customFees[d] || uniformFee}₽`)
                        .join('; ')
                    : null

            // ИСПРАВЛЕН entry_fee
            const parsedEntryFee = uniformFee ? parseInt(uniformFee, 10) : null

            const payload = {
                title: title.trim(),
                tournament_type: 'away' as const,
                organizer: organizer.trim() || null,
                city: city.trim(),
                venue_name: venueName.trim() || null,
                venue_address: venueAddress.trim() || null,
                start_date: startDate,
                end_date: endDate || null,
                registration_time: registrationTime.trim() || null,
                start_time: startTime.trim() || null,
                awards: awards.trim() || null,
                registration_deadline: registrationDeadline || null,
                entry_fee: Number.isNaN(parsedEntryFee) ? null : parsedEntryFee, // Безопасный каст
                entry_fee_note: feeNote,
                description: stripAwardsFromDescription(description) || null,
                contact_info: contactInfo.trim() || null,
                pdf_url: pdfInfo?.url ?? null,
                pdf_storage_path: pdfInfo?.path ?? null,
                categories: finalCategories,
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
                toast.error(result.error || 'Проверьте ошибки в форме')
            }
        })
    }

    const handleCancelClick = async () => {
        // ИСПРАВЛЕНИЕ: Удаляем функцию deleteTournamentPdf, если её нет.
        // Если юзер отменяет создание — пусть файл останется в хранилище как мусор,
        // крон-джоба в Supabase его сама очистит (это стандартная практика).
        if (onCancel) {
            onCancel()
        } else if (tournamentId) {
            router.push(`/tournaments/${tournamentId}`)
        } else {
            router.push('/tournaments')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {pdfInfo && (
                <div className="flex items-center gap-2 rounded-xl border border-accent bg-accent/10 px-3 py-2">
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

            {/* Название */}
            <Field label="Название *" error={errors.title}>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputCls(errors.title)}
                    placeholder="Открытый кубок Кущёвской"
                />
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

            {/* Место */}
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

            {/* Даты */}
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
                    <Field label="Окончание" error={errors.end_date}>
                        <input
                            type="date"
                            min={startDate || undefined}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={inputCls(errors.end_date)}
                        />
                    </Field>
                </div>
                <Field label="Дедлайн регистрации" error={errors.registration_deadline}>
                    <input
                        type="date"
                        max={startDate || undefined}
                        value={registrationDeadline}
                        onChange={(e) => setRegistrationDeadline(e.target.value)}
                        className={inputCls(errors.registration_deadline)}
                    />
                </Field>
            </div>

            {/* ДИСЦИПЛИНЫ */}
            <div className="space-y-2 rounded-2xl border border-card bg-card p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Дисциплины турнира *
                </h3>
                <p className="text-[11px] text-dim mb-3">Отметьте, в каких форматах проводятся игры</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {ALL_DISCIPLINES.map((d) => {
                        const isSelected = selectedDisciplines.includes(d.code)
                        return (
                            <button
                                key={d.code}
                                type="button"
                                onClick={() => toggleDiscipline(d.code)}
                                className={cn(
                                    'flex items-center justify-between p-3 rounded-xl border text-sm font-semibold transition-all text-left',
                                    isSelected
                                        ? 'border-accent bg-accent/10 text-accent'
                                        : 'border-subtle bg-subtle/50 text-muted hover:border-strong'
                                )}
                            >
                                <span>{d.label}</span>
                                <div
                                    className={cn(
                                        'w-5 h-5 rounded-md border flex items-center justify-center transition-all',
                                        isSelected ? 'bg-accent border-accent text-accent-foreground' : 'border-subtle'
                                    )}
                                >
                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ГРУППЫ */}
            <div className="space-y-2 rounded-2xl border border-card bg-card p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Категории по рейтингу (Группы) *
                </h3>
                <p className="text-[11px] text-dim mb-3">Выберите допустимые уровни мастерства игроков</p>
                <div className="grid grid-cols-5 gap-2">
                    {ALL_RATING_GROUPS.map((g) => {
                        const isSelected = selectedGroups.includes(g.code)
                        return (
                            <button
                                key={g.code}
                                type="button"
                                onClick={() => toggleGroup(g.code)}
                                className={cn(
                                    'flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center',
                                    isSelected
                                        ? 'border-accent bg-accent/10 text-accent font-black shadow-[0_0_10px_rgba(198,244,50,0.1)]'
                                        : 'border-subtle bg-subtle/50 text-muted hover:border-strong'
                                )}
                            >
                                <span className="text-base font-black">{g.code}</span>
                                <span className="text-[9px] opacity-70 mt-0.5">{g.hint}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ВЗНОС */}
            <div className="space-y-3 rounded-2xl border border-card bg-card p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Взнос</h3>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setFeeMode('uniform')}
                        className={cn(
                            'p-3 rounded-xl border text-left text-xs font-bold transition-all',
                            feeMode === 'uniform'
                                ? 'border-accent bg-accent/10 text-accent'
                                : 'border-subtle bg-subtle/50 text-muted'
                        )}
                    >
                        Единый взнос
                    </button>
                    <button
                        type="button"
                        onClick={() => setFeeMode('per_discipline')}
                        className={cn(
                            'p-3 rounded-xl border text-left text-xs font-bold transition-all',
                            feeMode === 'per_discipline'
                                ? 'border-accent bg-accent/10 text-accent'
                                : 'border-subtle bg-subtle/50 text-muted'
                        )}
                    >
                        По дисциплинам
                    </button>
                </div>

                {feeMode === 'uniform' ? (
                    <Field label="Сумма со всех участников (₽)">
                        <input
                            type="number"
                            value={uniformFee}
                            onChange={(e) => setUniformFee(e.target.value)}
                            className={inputCls()}
                            placeholder="500"
                            min={0}
                        />
                    </Field>
                ) : (
                    <div className="space-y-2 pt-1">
                        {selectedDisciplines.map((d) => (
                            <div key={d} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-strong w-10">{d}</span>
                                <input
                                    type="number"
                                    value={customFees[d] || ''}
                                    onChange={(e) => setCustomFees({ ...customFees, [d]: e.target.value })}
                                    className={inputCls()}
                                    placeholder="800"
                                    min={0}
                                />
                                <span className="text-xs text-muted">₽</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Расписание */}
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
                <Field label="Начало игр">
                    <input
                        type="text"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className={inputCls()}
                        placeholder="10:30"
                    />
                </Field>
            </div>

            {/* Награды */}
            <div className="space-y-2 rounded-2xl border border-card bg-card p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">🏆 Награды</h3>
                <Field label="Что получают победители и призёры">
          <textarea
              value={awards}
              onChange={(e) => setAwards(e.target.value)}
              className={cn(inputCls(), 'min-h-20 resize-y')}
              placeholder="Медали, кубки, грамоты, ценные призы"
              rows={3}
          />
                </Field>
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
                    {isPending ? (mode === 'edit' ? 'Сохраняем…' : 'Создаём…') : (mode === 'edit' ? 'Сохранить изменения' : 'Создать турнир')}
                </Button>
                <Button type="button" variant="ghost" fullWidth onClick={handleCancelClick} disabled={isPending}>
                    Отмена
                </Button>
            </div>
        </form>
    )
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
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