'use client'

import { useState } from 'react'
import { Plus, X, Wrench, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import { useProgressRouter } from '@/shared/hooks/use-progress-router'
import { createRacketRequest } from '@/app/(main)/profile/rackets/actions'
import {STRING_OPTIONS, TENSION_OPTIONS} from "@/shared/lib/rackets";

type RacketItem = {
    id: string
    racket_model: string
    needs_repair: boolean
    needs_restring: boolean
    string_type: string
    string_custom: string
    tension: string
    tension_custom: string
    notes: string
}

const emptyItem = (): RacketItem => ({
    id: Math.random().toString(36).slice(2),
    racket_model: '',
    needs_repair: false,
    needs_restring: false,
    string_type: '',
    string_custom: '',
    tension: '',
    tension_custom: '',
    notes: '',
})

// Примерные цены — синхронизируй с actions.ts
const PRICE_REPAIR = 500
const PRICE_RESTRING = 350

export function NewRacketForm() {
    const [items, setItems] = useState<RacketItem[]>([emptyItem()])
    const [runAction, isPending] = useProgressAction()
    const router = useProgressRouter()

    const addRacket = () => setItems((prev) => [...prev, emptyItem()])

    const removeRacket = (id: string) => {
        setItems((prev) => (prev.length === 1 ? prev : prev.filter((i) => i.id !== id)))
    }

    const updateItem = (id: string, patch: Partial<RacketItem>) => {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
    }

    const totalCost = items.reduce(
        (s, i) =>
            s +
            (i.needs_repair ? PRICE_REPAIR : 0) +
            (i.needs_restring ? PRICE_RESTRING : 0),
        0
    )

    const canSubmit = items.every(
        (i) => i.racket_model.trim() && (i.needs_repair || i.needs_restring)
    )

    const handleSubmit = () => {
        if (!canSubmit) {
            toast.error('Заполни модель и выбери действие для каждой ракетки')
            return
        }

        runAction(async () => {
            const formData = new FormData()
            formData.append(
                'items',
                JSON.stringify(
                    items.map((i) => ({
                        racket_model: i.racket_model.trim(),
                        needs_repair: i.needs_repair,
                        needs_restring: i.needs_restring,
                        string_type: i.string_type.trim() || null,
                        tension: i.tension.trim() || null,
                        notes: i.notes.trim() || null,
                    }))
                )
            )

            const result = await createRacketRequest(formData)
            if (result.success) {
                toast.success('Заявка отправлена')
                router.push('/profile/rackets')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })

        items.map((i) => ({
            racket_model: i.racket_model.trim(),
            needs_repair: i.needs_repair,
            needs_restring: i.needs_restring,
            string_type:
                i.needs_restring
                    ? i.string_type === 'other'
                        ? i.string_custom.trim() || null
                        : i.string_type || null
                    : null,
            tension:
                i.needs_restring
                    ? i.tension === 'other'
                        ? i.tension_custom.trim() || null
                        : i.tension || null
                    : null,
            notes: i.notes.trim() || null,
        }))
    }

    return (
        <div className="space-y-3">
            {items.map((item, idx) => (
                <RacketItemCard
                    key={item.id}
                    item={item}
                    index={idx}
                    canRemove={items.length > 1}
                    onUpdate={(patch) => updateItem(item.id, patch)}
                    onRemove={() => removeRacket(item.id)}
                />
            ))}

            <button
                type="button"
                onClick={addRacket}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-700 p-3 text-sm text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-300 disabled:opacity-40"
            >
                <Plus className="h-4 w-4" />
                Добавить ещё ракетку
            </button>

            {/* Итог */}
            <div className="sticky bottom-20 z-10 flex items-center justify-between rounded-2xl border border-lime-400/30 bg-lime-400/5 p-4">
                <div>
                    <div className="text-xs uppercase text-neutral-500">Итого</div>
                    <div className="text-2xl font-bold text-lime-400">{totalCost}₽</div>
                </div>
                <Button
                    variant="secondary"
                    size="md"
                    onClick={handleSubmit}
                    disabled={isPending || !canSubmit || totalCost === 0}
                >
                    Отправить
                </Button>
            </div>
        </div>
    )
}

function RacketItemCard({
                            item,
                            index,
                            canRemove,
                            onUpdate,
                            onRemove,
                        }: {
    item: RacketItem
    index: number
    canRemove: boolean
    onUpdate: (patch: Partial<RacketItem>) => void
    onRemove: () => void
}) {
    return (
        <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-center justify-between">
                <div className="text-xs font-medium uppercase text-neutral-500">
                    Ракетка {index + 1}
                </div>
                {canRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="rounded-lg p-1 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Модель */}
            <div>
                <label className="mb-1 block text-xs text-neutral-400">
                    Модель
                </label>
                <input
                    type="text"
                    value={item.racket_model}
                    onChange={(e) => onUpdate({ racket_model: e.target.value })}
                    placeholder="Например: Yonex Astrox 88D"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-lime-400/40 focus:outline-none"
                />
            </div>

            {/* Действия */}
            <div>
                <div className="mb-2 text-xs text-neutral-400">Что нужно</div>
                <div className="grid grid-cols-2 gap-2">
                    <ActionToggle
                        label="Ремонт"
                        price={PRICE_REPAIR}
                        icon={<Wrench className="h-4 w-4" />}
                        active={item.needs_repair}
                        onToggle={() => onUpdate({ needs_repair: !item.needs_repair })}
                    />
                    <ActionToggle
                        label="Натяжка"
                        price={PRICE_RESTRING}
                        icon={<Zap className="h-4 w-4" />}
                        active={item.needs_restring}
                        onToggle={() => onUpdate({ needs_restring: !item.needs_restring })}
                    />
                </div>
            </div>

            {/* Детали натяжки */}
            {/* Детали натяжки */}
            {item.needs_restring && (
                <div className="space-y-2 rounded-xl bg-neutral-950 p-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="mb-1 block text-xs text-neutral-400">
                                Струна
                            </label>
                            <select
                                value={item.string_type}
                                onChange={(e) => onUpdate({ string_type: e.target.value })}
                                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-2 text-sm text-white focus:border-lime-400/40 focus:outline-none"
                            >
                                <option value="">— выбери —</option>
                                {STRING_OPTIONS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-neutral-400">
                                Натяжение
                            </label>
                            <select
                                value={item.tension}
                                onChange={(e) => onUpdate({ tension: e.target.value })}
                                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-2 text-sm text-white focus:border-lime-400/40 focus:outline-none"
                            >
                                <option value="">— выбери —</option>
                                {TENSION_OPTIONS.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Если "other" — показать ручной ввод */}
                    {item.string_type === 'other' && (
                        <input
                            type="text"
                            value={item.string_custom ?? ''}
                            onChange={(e) => onUpdate({ string_custom: e.target.value })}
                            placeholder="Название струны"
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-2 text-sm text-white placeholder-neutral-600 focus:border-lime-400/40 focus:outline-none"
                        />
                    )}
                    {item.tension === 'other' && (
                        <input
                            type="text"
                            value={item.tension_custom ?? ''}
                            onChange={(e) => onUpdate({ tension_custom: e.target.value })}
                            placeholder="Натяжение (например: 13.5 кг)"
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-2 text-sm text-white placeholder-neutral-600 focus:border-lime-400/40 focus:outline-none"
                        />
                    )}
                </div>
            )}

            {/* Комментарий */}
            <div>
                <label className="mb-1 block text-xs text-neutral-400">
                    Комментарий (необязательно)
                </label>
                <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => onUpdate({ notes: e.target.value })}
                    placeholder="Что-то ещё..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-lime-400/40 focus:outline-none"
                />
            </div>
        </div>
    )
}

function ActionToggle({
                          label,
                          price,
                          icon,
                          active,
                          onToggle,
                      }: {
    label: string
    price: number
    icon: React.ReactNode
    active: boolean
    onToggle: () => void
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                'flex items-center gap-2 rounded-xl border p-3 text-left transition',
                active
                    ? 'border-lime-400/40 bg-lime-400/10'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
            )}
        >
            <div
                className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    active ? 'bg-lime-400/20 text-lime-400' : 'bg-neutral-900 text-neutral-500'
                )}
            >
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <div
                    className={cn(
                        'text-sm font-medium',
                        active ? 'text-white' : 'text-neutral-400'
                    )}
                >
                    {label}
                </div>
                <div className="text-xs text-neutral-500">{price}₽</div>
            </div>
        </button>
    )
}