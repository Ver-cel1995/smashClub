'use client'

import {useState, useTransition} from 'react'
import {toast} from 'sonner'
import {Check, FileText} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {cn} from '@/shared/lib/utils'
import {useProgressRouter} from '@/shared/hooks/use-progress-router'
import {createTournament, updateTournament,} from '@/app/(main)/tournaments/actions'
import type {ParsedTournament} from '@/shared/lib/ai/parse-tournament-pdf'

type Discipline = 'MS' | 'WS' | 'MD' | 'WD' | 'XD'
type RatingGroup = 'A' | 'B' | 'C' | 'D' | 'E'

/** Категории, уже сохранённые в БД (режим редактирования). */
export type InitialCategory = {
    category: Discipline
    rating_group: RatingGroup
}

type Props = {
    mode?: 'create' | 'edit'
    tournamentId?: string
    initialData: ParsedTournament | null
    /** Приоритетнее, чем initialData.categories: точные данные из БД. */
    initialCategories?: InitialCategory[]
    pdfInfo: { url: string; path: string } | null
    onCancel?: () => void
}

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

const GROUP_CODES: RatingGroup[] = ['A', 'B', 'C', 'D', 'E']

function normalizeGroup(raw: string | null | undefined): RatingGroup {
    const g = raw?.replace(/^Группа\s+/i, '').trim().toUpperCase() ?? ''
    return (GROUP_CODES as string[]).includes(g) ? (g as RatingGroup) : 'C'
}

/** Собирает карту «дисциплина → группы» из уже сохранённых категорий. */
function buildInitialMatrix(
    initialCategories: InitialCategory[] | undefined,
    parsed: ParsedTournament | null
): Record<string, RatingGroup[]> {
    const matrix: Record<string, RatingGroup[]> = {}

    const source: Array<{ category: string; group: RatingGroup }> =
        initialCategories?.length
            ? initialCategories.map((c) => ({ category: c.category, group: normalizeGroup(c.rating_group) }))
            : (parsed?.categories ?? []).map((c) => ({
                category: c.category,
                group: normalizeGroup(c.age_group),
            }))

    for (const { category, group } of source) {
        const list = (matrix[category] ??= [])
        if (!list.includes(group)) list.push(group)
    }

    return matrix
}

export function TournamentForm({
                                   mode = 'create',
                                   tournamentId,
                                   initialData,
                                   initialCategories,
                                   pdfInfo,
                                   onCancel,
                               }: Props) {
    const router = useProgressRouter()
    const [isPending, startTransition] = useTransition()

    const initialMatrix = buildInitialMatrix(initialCategories, initialData)
    const hasInitialCategories = Object.keys(initialMatrix).length > 0

    const defaultDisciplines: Discipline[] = hasInitialCategories
        ? (Object.keys(initialMatrix) as Discipline[])
        : ['MS', 'MD', 'XD']

    const defaultMatrix: Record<string, RatingGroup[]> = hasInitialCategories
        ? initialMatrix
        : { MS: ['C'], MD: ['C'], XD: ['C'] }

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

    // Дисциплины и группы, выбранные отдельно для каждой дисциплины
    const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>(defaultDisciplines)
    const [groupsByDiscipline, setGroupsByDiscipline] =
        useState<Record<string, RatingGroup[]>>(defaultMatrix)

    const [description, setDescription] = useState(
        stripAwardsFromDescription(initialData?.description)
    )
    const [contactInfo, setContactInfo] = useState(initialData?.contact_info ?? '')
    const [errors, setErrors] = useState<Record<string, string>>({})

    const toggleDiscipline = (code: Discipline) => {
        setSelectedDisciplines((prev) => {
            if (prev.includes(code)) return prev.filter((d) => d !== code)
            // Новая дисциплина получает группу C по умолчанию, если её ещё нет
            setGroupsByDiscipline((matrix) =>
                matrix[code]?.length ? matrix : { ...matrix, [code]: ['C'] }
            )
            return [...prev, code]
        })
    }

    const toggleGroup = (discipline: Discipline, code: RatingGroup) => {
        setGroupsByDiscipline((prev) => {
            const current = prev[discipline] ?? []
            const next = current.includes(code)
                ? current.filter((g) => g !== code)
                : [...current, code]
            return { ...prev, [discipline]: next }
        })
    }

    /** Применить один и тот же набор групп ко всем выбранным дисциплинам. */
    const applyGroupsToAll = (source: Discipline) => {
        const groups = groupsByDiscipline[source] ?? []
        setGroupsByDiscipline((prev) => {
            const next = { ...prev }
            for (const d of selectedDisciplines) next[d] = [...groups]
            return next
        })
        toast.success('Группы применены ко всем дисциплинам')
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

        const withoutGroups = selectedDisciplines.filter(
            (d) => (groupsByDiscipline[d] ?? []).length === 0
        )
        if (withoutGroups.length > 0) {
            toast.error(`Выберите группы для: ${withoutGroups.join(', ')}`)
            return
        }

        startTransition(async () => {
            // Каждая дисциплина со своим набором групп → отдельная категория
            const finalCategories = selectedDisciplines.flatMap((disc) =>
                (groupsByDiscipline[disc] ?? []).map((grp) => ({
                    category: disc,
                    rating_group: grp,
                    max_pairs: null,
                }))
            )

            const feeNote =
                feeMode === 'per_discipline'
                    ? selectedDisciplines
                        .map((d) => `${d}: ${customFees[d] || uniformFee}₽`)
                        .join('; ')
                    : null

            // Взнос: пустая строка и мусорный ввод дают null, а не NaN
            const rawFee = Number.parseInt(uniformFee, 10)
            const parsedEntryFee = Number.isFinite(rawFee) ? rawFee : null

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
                entry_fee: parsedEntryFee,
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

            {/* ГРУППЫ — отдельно для каждой выбранной дисциплины */}
            <div className="space-y-3 rounded-2xl border border-card bg-card p-4">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                        Категории по рейтингу (Группы) *
                    </h3>
                    <p className="text-[11px] text-dim">
                        Для каждой дисциплины отметьте группы, которые в ней разыгрываются
                    </p>
                </div>

                {selectedDisciplines.length === 0 ? (
                    <p className="text-xs text-dim italic py-2">Сначала выберите дисциплины выше</p>
                ) : (
                    selectedDisciplines.map((disc) => {
                        const groups = groupsByDiscipline[disc] ?? []
                        const label = ALL_DISCIPLINES.find((d) => d.code === disc)?.label ?? disc

                        return (
                            <div key={disc} className="rounded-xl border border-subtle bg-subtle/30 p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-strong">{label}</span>
                                    {selectedDisciplines.length > 1 && groups.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => applyGroupsToAll(disc)}
                                            className="text-[10px] font-semibold text-accent hover:underline shrink-0"
                                        >
                                            Применить ко всем
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-5 gap-1.5">
                                    {ALL_RATING_GROUPS.map((g) => {
                                        const isSelected = groups.includes(g.code)
                                        return (
                                            <button
                                                key={g.code}
                                                type="button"
                                                onClick={() => toggleGroup(disc, g.code)}
                                                className={cn(
                                                    'flex flex-col items-center justify-center py-2 rounded-lg border transition-all text-center',
                                                    isSelected
                                                        ? 'border-accent bg-accent/10 text-accent font-black'
                                                        : 'border-subtle bg-card text-muted hover:border-strong'
                                                )}
                                            >
                                                <span className="text-sm font-black">{g.code}</span>
                                                <span className="text-[9px] opacity-70">{g.hint}</span>
                                            </button>
                                        )
                                    })}
                                </div>

                                {groups.length === 0 && (
                                    <p className="text-[10px] text-danger">Выберите хотя бы одну группу</p>
                                )}
                            </div>
                        )
                    })
                )}

                <p className="text-[11px] text-dim border-t border-subtle pt-2">
                    Будет создано категорий:{' '}
                    <span className="font-bold text-accent">
                        {selectedDisciplines.reduce(
                            (sum, d) => sum + (groupsByDiscipline[d]?.length ?? 0),
                            0
                        )}
                    </span>
                </p>
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