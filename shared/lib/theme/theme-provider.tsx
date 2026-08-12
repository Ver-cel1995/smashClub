'use client'

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'

export type AccentColor =
    | 'lime'
    | 'emerald'
    | 'sky'
    | 'violet'
    | 'rose'
    | 'amber'
    | 'cyan'
    | 'indigo'

export type ThemeMode = 'dark' | 'light'

export interface AccentOption {
    id: AccentColor
    name: string
    hex: string
    hoverHex: string
    glow: string
    foreground: string
    mutedBg: string
    border: string
    textClass: string
}

export const ACCENT_PALETTES: Record<AccentColor, AccentOption> = {
    lime: {
        id: 'lime',
        name: 'Лайм',
        hex: '#a3e635',
        hoverHex: '#84cc16',
        glow: 'rgba(163, 230, 53, 0.4)',
        foreground: '#09090b',
        mutedBg: 'rgba(163, 230, 53, 0.12)',
        border: 'rgba(163, 230, 53, 0.3)',
        textClass: 'text-accent',
    },
    emerald: {
        id: 'emerald',
        name: 'Изумруд',
        hex: '#34d399',
        hoverHex: '#10b981',
        glow: 'rgba(52, 211, 153, 0.4)',
        foreground: '#09090b',
        mutedBg: 'rgba(52, 211, 153, 0.12)',
        border: 'rgba(52, 211, 153, 0.3)',
        textClass: 'text-accent',
    },
    sky: {
        id: 'sky',
        name: 'Небесный',
        hex: '#38bdf8',
        hoverHex: '#0ea5e9',
        glow: 'rgba(56, 189, 248, 0.4)',
        foreground: '#09090b',
        mutedBg: 'rgba(56, 189, 248, 0.12)',
        border: 'rgba(56, 189, 248, 0.3)',
        textClass: 'text-accent',
    },
    violet: {
        id: 'violet',
        name: 'Фиолетовый',
        hex: '#a78bfa',
        hoverHex: '#8b5cf6',
        glow: 'rgba(167, 139, 250, 0.4)',
        foreground: '#ffffff',
        mutedBg: 'rgba(167, 139, 250, 0.15)',
        border: 'rgba(167, 139, 250, 0.3)',
        textClass: 'text-accent',
    },
    rose: {
        id: 'rose',
        name: 'Коралл',
        hex: '#fb7185',
        hoverHex: '#f43f5e',
        glow: 'rgba(251, 113, 133, 0.4)',
        foreground: '#ffffff',
        mutedBg: 'rgba(251, 113, 133, 0.15)',
        border: 'rgba(251, 113, 133, 0.3)',
        textClass: 'text-accent',
    },
    amber: {
        id: 'amber',
        name: 'Янтарь',
        hex: '#fbbf24',
        hoverHex: '#f59e0b',
        glow: 'rgba(251, 191, 36, 0.4)',
        foreground: '#09090b',
        mutedBg: 'rgba(251, 191, 36, 0.12)',
        border: 'rgba(251, 191, 36, 0.3)',
        textClass: 'text-accent',
    },
    cyan: {
        id: 'cyan',
        name: 'Бирюза',
        hex: '#22d3ee',
        hoverHex: '#06b6d4',
        glow: 'rgba(34, 211, 238, 0.4)',
        foreground: '#09090b',
        mutedBg: 'rgba(34, 211, 238, 0.12)',
        border: 'rgba(34, 211, 238, 0.3)',
        textClass: 'text-accent',
    },
    indigo: {
        id: 'indigo',
        name: 'Индиго',
        hex: '#818cf8',
        hoverHex: '#6366f1',
        glow: 'rgba(129, 140, 248, 0.4)',
        foreground: '#ffffff',
        mutedBg: 'rgba(129, 140, 248, 0.15)',
        border: 'rgba(129, 140, 248, 0.3)',
        textClass: 'text-accent',
    },
}

export interface ThemeContextType {
    theme: ThemeMode
    resolvedTheme: 'dark' | 'light'
    accentColor: AccentColor
    accent: AccentOption
    setTheme: (mode: ThemeMode) => void
    toggleTheme: () => void
    setAccentColor: (color: AccentColor) => void
    availableAccents: AccentOption[]
}

const THEME_STORAGE_KEY = 'smashclub-theme-mode'
const ACCENT_STORAGE_KEY = 'smashclub-accent-color'

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>('dark')
    const [accentColor, setAccentColorState] = useState<AccentColor>('lime')

    // Синхронизация состояния с localStorage при монтировании
    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
        if (savedTheme && ['dark', 'light'].includes(savedTheme)) {
            setThemeState(savedTheme)
        }

        const savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY) as AccentColor | null
        if (savedAccent && savedAccent in ACCENT_PALETTES) {
            setAccentColorState(savedAccent)
        }
    }, [])

    // Применение темы к HTML
    useEffect(() => {
        const root = document.documentElement
        root.setAttribute('data-theme', theme)
        if (theme === 'dark') {
            root.classList.add('dark')
            root.classList.remove('light')
        } else {
            root.classList.add('light')
            root.classList.remove('dark')
        }
    }, [theme])

    // Применение CSS-переменных акцента к HTML
    useEffect(() => {
        const palette = ACCENT_PALETTES[accentColor] || ACCENT_PALETTES.lime
        const root = document.documentElement

        root.setAttribute('data-accent', accentColor)
        root.style.setProperty('--accent-color', palette.hex)
        root.style.setProperty('--accent-hover', palette.hoverHex)
        root.style.setProperty('--accent-glow', palette.glow)
        root.style.setProperty('--accent-foreground', palette.foreground)
        root.style.setProperty('--accent-muted', palette.mutedBg)
        root.style.setProperty('--accent-border', palette.border)
    }, [accentColor])

    const setTheme = useCallback((mode: ThemeMode) => {
        setThemeState(mode)
        localStorage.setItem(THEME_STORAGE_KEY, mode)
    }, [])

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark'
            localStorage.setItem(THEME_STORAGE_KEY, next)
            return next
        })
    }, [])

    const setAccentColor = useCallback((color: AccentColor) => {
        if (color in ACCENT_PALETTES) {
            setAccentColorState(color)
            localStorage.setItem(ACCENT_STORAGE_KEY, color)
        }
    }, [])

    const accent = ACCENT_PALETTES[accentColor] || ACCENT_PALETTES.lime
    const availableAccents = useMemo(() => Object.values(ACCENT_PALETTES), [])

    const value = useMemo(
        () => ({
            theme,
            resolvedTheme: theme,
            accentColor,
            accent,
            setTheme,
            toggleTheme,
            setAccentColor,
            availableAccents,
        }),
        [theme, accentColor, accent, setTheme, toggleTheme, setAccentColor, availableAccents]
    )

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useThemeContext() {
    const ctx = useContext(ThemeContext)
    if (!ctx) {
        throw new Error('useThemeContext must be used within ThemeProvider')
    }
    return ctx
}
