import { create } from 'zustand'

interface UIStore {
    fabOpen: boolean
    isNavigating: boolean
    pendingAction: string | null

    setFabOpen: (open: boolean) => void
    toggleFab: () => void
    setNavigating: (v: boolean) => void
    setPendingAction: (a: string | null) => void
}

export const useUIStore = create<UIStore>((set) => ({
    fabOpen: false,
    isNavigating: false,
    pendingAction: null,

    setFabOpen: (fabOpen) => set({ fabOpen }),
    toggleFab: () => set((s) => ({ fabOpen: !s.fabOpen })),
    setNavigating: (isNavigating) => set({ isNavigating }),
    setPendingAction: (pendingAction) => set({ pendingAction }),
}))