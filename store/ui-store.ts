import { create } from 'zustand'

interface UIState {
    /** Глобальный навигационный loading */
    isNavigating: boolean
    setNavigating: (v: boolean) => void

    /** Текущий pending action (для блокировки UI) */
    pendingAction: string | null
    setPendingAction: (action: string | null) => void

    /** FAB */
    fabOpen: boolean
    setFabOpen: (open: boolean) => void
    toggleFab: () => void
}

export const useUIStore = create<UIState>((set) => ({
    isNavigating: false,
    setNavigating: (v) => set({ isNavigating: v }),

    pendingAction: null,
    setPendingAction: (action) => set({ pendingAction: action }),

    fabOpen: false,
    setFabOpen: (open) => set({ fabOpen: open }),
    toggleFab: () => set((s) => ({ fabOpen: !s.fabOpen })),
}))