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
    | 'lime' | 'emerald' | 'sky' | 'violet'
    | 'rose' | 'amber' | 'cyan' | 'indigo'

export type ThemeMode = 'dark' | 'light' | 'system'

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
    lime:    { id: 'lime',    name: 'Лайм',       hex: '#a3e635', hoverHex: '#84cc16', glow: 'rgba(163,230,53,0.4)',  foreground: '#09090b', mutedBg: 'rgba(163,230,53,0.12)',  border: 'rgba(163,230,53,0.3)',  textClass: 'text-lime-400' },
    emerald: { id: 'emerald', name: 'Изумруд',    hex: '#34d399', hoverHex: '#10b981', glow: 'rgba(52,211,153,0.4)',  foreground: '#09090b', mutedBg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  textClass: 'text-emerald-400' },
    sky:     { id: 'sky',     name: 'Небесный',   hex: '#38bdf8', hoverHex: '#0ea5e9', glow: 'rgba(56,189,248,0.4)',  foreground: '#09090b', mutedBg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.3)',  textClass: 'text-sky-400' },
    violet:  { id: 'violet',  name: 'Фиолетовый', hex: '#a78bfa', hoverHex: '#8b5cf6', glow: 'rgba(167,139,250,0.4)', foreground: '#ffffff', mutedBg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)', textClass: 'text-violet-400' },
    rose:    { id: 'rose',    name: 'Коралл',     hex: '#fb7185', hoverHex: '#f43f5e', glow: 'rgba(251,113,133,0.4)', foreground: '#ffffff', mutedBg: 'rgba(251,113,133,0.15)', border: 'rgba(251,113,133,0.3)', textClass: 'text-rose-400' },
    amber:   { id: 'amber',   name: 'Янтарь',     hex: '#fbbf24', hoverHex: '#f59e0b', glow: 'rgba(251,191,36,0.4)',  foreground: '#09090b', mutedBg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  textClass: 'text-amber-400' },
    cyan:    { id: 'cyan',    name: 'Бирюза',     hex: '#22d3ee', hoverHex: '#06b6d4', glow: 'rgba(34,211,238,0.4)',  foreground: '#09090b', mutedBg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.3)',  textClass: 'text-cyan-400' },
    indigo:  { id: 'indigo',  name: 'Индиго',     hex: '#818cf8', hoverHex: '#6366f1', glow: 'rgba(129,140,248,0.4)', foreground: '#ffffff', mutedBg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.3)', textClass: 'text-indigo-400' },
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

/**
 * Читаем реальное состояние из <html>, куда его записал FOUC-скрипт.
 * Это устраняет любые расхождения между SSR-дефолтом и тем, что уже применено.
 */
function readInitialState() {
    if (typeof window === 'undefined') {
        return { mode: 'dark' as ThemeMode, accent: 'lime' as AccentColor, resolved: 'dark' as const }
    }
    const storedMode = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null) || 'dark'
    const storedAccent = (localStorage.getItem(ACCENT_STORAGE_KEY) as AccentColor | null) || 'lime'
    const validMode: ThemeMode = ['dark', 'light', 'system'].includes(storedMode) ? storedMode : 'dark'
    const validAccent: AccentColor = storedAccent in ACCENT_PALETTES ? storedAccent : 'lime'

    const resolved =
        validMode === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : validMode

    return { mode: validMode, accent: validAccent, resolved }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>('dark')
    const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')
    const [accentColor, setAccentColorState] = useState<AccentColor>('lime')

    // Синхронизируемся с тем, что уже установил FOUC-скрипт
    useEffect(() => {
        const initial = readInitialState()
        setThemeState(initial.mode)
        setAccentColorState(initial.accent)
        setResolvedTheme(initial.resolved)
    }, [])

    // Применение темы к <html>
    useEffect(() => {
        const applyTheme = () => {
            const activeTheme: 'dark' | 'light' =
                theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme

            setResolvedTheme(activeTheme)
            const root = document.documentElement
            root.setAttribute('data-theme', activeTheme)
            root.classList.toggle('dark', activeTheme === 'dark')
            root.classList.toggle('light', activeTheme === 'light')
        }

        applyTheme()

        if (theme === 'system') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)')
            const listener = () => applyTheme()
            mq.addEventListener('change', listener)
            return () => mq.removeEventListener('change', listener)
        }
    }, [theme])

    // Применение акцентного цвета
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
        try { localStorage.setItem(THEME_STORAGE_KEY, mode) } catch {}
    }, [])

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => {
            const next: ThemeMode = prev === 'dark' ? 'light' : 'dark'
            try { localStorage.setItem(THEME_STORAGE_KEY, next) } catch {}
            return next
        })
    }, [])

    const setAccentColor = useCallback((color: AccentColor) => {
        if (color in ACCENT_PALETTES) {
            setAccentColorState(color)
            try { localStorage.setItem(ACCENT_STORAGE_KEY, color) } catch {}
        }
    }, [])

    const accent = ACCENT_PALETTES[accentColor] || ACCENT_PALETTES.lime
    const availableAccents = useMemo(() => Object.values(ACCENT_PALETTES), [])

    const value = useMemo(
        () => ({
            theme, resolvedTheme, accentColor, accent,
            setTheme, toggleTheme, setAccentColor, availableAccents,
        }),
        [theme, resolvedTheme, accentColor, accent, setTheme, toggleTheme, setAccentColor, availableAccents]
    )

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeContext() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider')
    return ctx
}