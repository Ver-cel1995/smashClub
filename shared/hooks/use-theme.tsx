'use client'

import { useThemeContext } from '@/shared/lib/theme/theme-provider'

/**
 * Глобальный хук управления темой и акцентными цветами интерфейса.
 *
 * Предоставляет:
 * - theme: 'dark' | 'light' | 'system'
 * - resolvedTheme: 'dark' | 'light' (итоговая активная тема)
 * - accentColor: 'lime' | 'emerald' | 'sky' | 'violet' | 'rose' | 'amber' | 'cyan' | 'indigo'
 * - accent: объект с hex, hover, glow, foreground, mutedBg, border
 * - setTheme(mode): переключение режима
 * - toggleTheme(): быстрое переключение тёмная <-> светлая
 * - setAccentColor(color): сменить акцентный цвет всех компонентов
 * - availableAccents: список всех палитр
 */
export function useTheme() {
    return useThemeContext()
}