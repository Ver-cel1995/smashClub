'use client'

import { useTheme } from '@/shared/hooks/use-theme'
import { Sun, Moon, Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { AccentColor, ThemeMode } from '@/shared/lib/theme/theme-provider'

export function ThemeSelector() {
    const {
        theme,
        accentColor,
        setTheme,
        setAccentColor,
        availableAccents,
    } = useTheme()

    const modeOptions: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
        { id: 'dark', label: 'Тёмная', icon: Moon },
        { id: 'light', label: 'Светлая', icon: Sun },
    ]

    return (
        <div className="space-y-5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
            <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                    Тема оформления
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                    Выберите режим отображения ({theme === 'dark' ? 'Тёмный' : 'Светлый'} активен)
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                    {modeOptions.map((item) => {
                        const Icon = item.icon
                        const isActive = theme === item.id

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTheme(item.id)}
                                className={cn(
                                    'flex items-center justify-center gap-2 rounded-xl border py-3 px-3 transition-all',
                                    isActive
                                        ? 'border-[var(--accent-color)] bg-[var(--accent-muted)] text-[var(--accent-color)] font-semibold shadow-sm'
                                        : 'border-[var(--border-card)] bg-[var(--bg-input)] text-[var(--text-muted)] hover:border-neutral-700 hover:text-[var(--text-main)]'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="text-xs">{item.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="border-t border-[var(--border-card)] pt-4">
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                    Акцентный цвет
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-3">
                    Меняет цвет кнопок, плашек, карточек, тегов и активных иконок
                </p>

                <div className="grid grid-cols-4 gap-2.5">
                    {availableAccents.map((palette) => {
                        const isSelected = accentColor === palette.id

                        return (
                            <button
                                key={palette.id}
                                type="button"
                                onClick={() => setAccentColor(palette.id as AccentColor)}
                                className={cn(
                                    'group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all',
                                    isSelected
                                        ? 'border-[var(--accent-color)] bg-[var(--accent-muted)] shadow-md scale-105'
                                        : 'border-[var(--border-card)] bg-[var(--bg-input)] hover:border-neutral-600'
                                )}
                            >
                                <div
                                    className="relative flex h-8 w-8 items-center justify-center rounded-full shadow-inner transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: palette.hex }}
                                >
                                    {isSelected && (
                                        <Check
                                            className="h-4 w-4"
                                            style={{ color: palette.foreground }}
                                        />
                                    )}
                                </div>
                                <span className="text-[11px] font-medium text-[var(--text-main)] truncate w-full text-center">
                                    {palette.name}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
