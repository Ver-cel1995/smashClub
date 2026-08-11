'use client'

import { useTheme } from '@/shared/hooks/use-theme'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { AccentColor, ThemeMode } from '@/shared/lib/theme/theme-provider'

export function ThemeSelector() {
    const {
        theme,
        resolvedTheme,
        accentColor,
        setTheme,
        setAccentColor,
        availableAccents,
    } = useTheme()

    const modeOptions: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
        { id: 'dark', label: 'Тёмная', icon: Moon },
        { id: 'light', label: 'Светлая', icon: Sun },
        { id: 'system', label: 'Системная', icon: Monitor },
    ]

    return (
        <div className="space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div>
                <h3 className="text-sm font-semibold text-white dark:text-white">
                    Тема оформления
                </h3>
                <p className="text-xs text-neutral-400">
                    Выберите режим отображения интерфейса ({resolvedTheme === 'dark' ? 'Тёмный' : 'Светлый'} активен)
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2">
                    {modeOptions.map((item) => {
                        const Icon = item.icon
                        const isActive = theme === item.id

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTheme(item.id)}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-1.5 rounded-xl border py-2.5 px-2 transition-all',
                                    isActive
                                        ? 'border-[var(--accent-color)] bg-[var(--accent-muted)] text-[var(--accent-color)] font-medium'
                                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="text-xs">{item.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="border-t border-neutral-800/80 pt-4">
                <h3 className="text-sm font-semibold text-white">
                    Акцентный цвет
                </h3>
                <p className="text-xs text-neutral-400 mb-3">
                    Глобально меняет цвет ключевых элементов, кнопок и плашек
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
                                        ? 'border-white bg-neutral-800 shadow-md scale-105'
                                        : 'border-neutral-800/80 bg-neutral-950/60 hover:border-neutral-700'
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
                                <span className="text-[11px] font-medium text-neutral-300 truncate w-full text-center">
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