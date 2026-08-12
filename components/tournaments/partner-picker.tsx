'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, User, UserPlus, X, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { UserAvatar } from '@/components/user-avatar'
import {
    searchPlayers,
    type PlayerSearchResult,
} from '@/app/(main)/tournaments/actions'

type PartnerChoice =
    | null
    | { kind: 'player'; player_id: string; full_name: string }
    | { kind: 'guest'; full_name: string }

type Props = {
    value: PartnerChoice
    onChange: (value: PartnerChoice) => void
    disabled?: boolean
}

type Mode = 'search' | 'guest' | 'selected'

export function PartnerPicker({ value, onChange, disabled }: Props) {
    const [mode, setMode] = useState<Mode>(value ? 'selected' : 'search')

    // Если снаружи изменили value — синхронизируем
    useEffect(() => {
        if (value) {
            setMode('selected')
        } else if (mode === 'selected') {
            setMode('search')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    if (mode === 'selected' && value) {
        return (
            <div className="flex items-center gap-2 rounded-xl bg-card p-2">
                {value.kind === 'player' ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-muted">
                        <User className="h-4 w-4 text-accent" />
                    </div>
                ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-subtle text-xs text-muted">
                        Г
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-semibold text-strong">
                        {value.full_name}
                    </p>
                    <p className="text-[10px] text-muted">
                        {value.kind === 'player' ? 'Игрок клуба' : 'Гость'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        onChange(null)
                        setMode('search')
                    }}
                    disabled={disabled}
                    className="rounded-lg p-1.5 text-muted hover:bg-hover hover:text-strong"
                    aria-label="Убрать партнёра"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Партнёр
            </p>

            {mode === 'search' && (
                <>
                    <PlayerSearchInput
                        onSelect={(player) => {
                            onChange({
                                kind: 'player',
                                player_id: player.id,
                                full_name: player.full_name,
                            })
                        }}
                        disabled={disabled}
                    />
                    <button
                        type="button"
                        onClick={() => setMode('guest')}
                        disabled={disabled}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-card px-3 py-2 text-xs text-muted hover:border-strong hover:text-strong transition-colors"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        Добавить гостя вручную
                    </button>
                    <p className="text-[10px] text-dim">
                        Или оставь пустым — тебя запишет как «ищет партнёра»
                    </p>
                </>
            )}

            {mode === 'guest' && (
                <GuestInput
                    onConfirm={(name) => {
                        onChange({ kind: 'guest', full_name: name })
                    }}
                    onCancel={() => setMode('search')}
                    disabled={disabled}
                />
            )}
        </div>
    )
}

// ============================================================
// Поиск по клубу
// ============================================================

function PlayerSearchInput({
                               onSelect,
                               disabled,
                           }: {
    onSelect: (player: PlayerSearchResult) => void
    disabled?: boolean
}) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<PlayerSearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setIsSearching(true)
            const result = await searchPlayers(query)
            setIsSearching(false)
            if (result.success) {
                setResults(result.data ?? [])
            }
        }, 250)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [query])

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                    disabled={disabled}
                    placeholder="Найти игрока клуба…"
                    className="w-full rounded-lg border border-card bg-input pl-8 pr-8 py-2 text-xs text-main placeholder:text-dim focus:outline-none focus:border-accent"
                />
                {isSearching && (
                    <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted" />
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-card bg-elevated shadow-elevated">
                    {results.map((player) => (
                        <button
                            key={player.id}
                            type="button"
                            onMouseDown={(e) => {
                                // MouseDown, чтобы сработать до blur input'а
                                e.preventDefault()
                                onSelect(player)
                            }}
                            className="flex w-full items-center gap-2 px-2.5 py-2 text-left hover:bg-hover transition-colors"
                        >
                            <UserAvatar
                                name={player.full_name}
                                avatarUrl={player.avatar_url}
                                size="sm"
                            />
                            <span className="text-xs text-main truncate">
                                {player.full_name}
                            </span>
                            {player.role === 'coach' && (
                                <span className="ml-auto text-[9px] font-bold uppercase text-accent">
                                    Тренер
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {isOpen && !isSearching && results.length === 0 && query.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-card bg-elevated p-3 text-center">
                    <p className="text-xs text-muted">Никого не нашлось</p>
                </div>
            )}
        </div>
    )
}

// ============================================================
// Ввод гостя вручную
// ============================================================

function GuestInput({
                        onConfirm,
                        onCancel,
                        disabled,
                    }: {
    onConfirm: (name: string) => void
    onCancel: () => void
    disabled?: boolean
}) {
    const [name, setName] = useState('')

    const handleConfirm = () => {
        const trimmed = name.trim()
        if (trimmed.length < 2) return
        onConfirm(trimmed)
    }

    return (
        <div className="space-y-2">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        handleConfirm()
                    }
                }}
                disabled={disabled}
                placeholder="Имя гостя (например «Иван Петров»)"
                className="w-full rounded-lg border border-card bg-input px-3 py-2 text-xs text-main placeholder:text-dim focus:outline-none focus:border-accent"
                autoFocus
            />
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={disabled}
                    className="flex-1 rounded-lg border border-card bg-subtle py-1.5 text-xs text-muted hover:bg-hover hover:text-strong transition-colors"
                >
                    Назад
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={disabled || name.trim().length < 2}
                    className="flex-1 rounded-lg bg-accent py-1.5 text-xs font-semibold text-[var(--accent-foreground)] hover:opacity-90 disabled:opacity-50"
                >
                    Добавить
                </button>
            </div>
        </div>
    )
}