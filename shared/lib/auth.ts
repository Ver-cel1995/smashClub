import { createClient } from '@/shared/lib/supabase/server'
import type { Profile } from '@/types'

/**
 * Получает текущего пользователя вместе с профилем.
 * Возвращает null если не залогинен.
 * Использовать в Server Components.
 */
export async function getCurrentUser(): Promise<{
    userId: string
    email: string
    profile: Profile
} | null> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (error || !profile) {
        console.error('Failed to load profile:', error)
        return null
    }

    return {
        userId: user.id,
        email: user.email!,
        profile: profile as Profile,
    }
}

/**
 * Проверка: текущий пользователь — тренер?
 */
export async function isCoach(): Promise<boolean> {
    const user = await getCurrentUser()
    return user?.profile.role === 'coach'
}