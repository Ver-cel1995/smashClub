import { create } from 'zustand'

type AppState = {
    // Текущий пользователь (кэш на клиенте)
    userId: string | null
    isCoach: boolean
    setUser: (userId: string, isCoach: boolean) => void
    clearUser: () => void
}

export const useAppStore = create<AppState>((set) => ({
    userId: null,
    isCoach: false,
    setUser: (userId, isCoach) => set({ userId, isCoach }),
    clearUser: () => set({ userId: null, isCoach: false }),
}))