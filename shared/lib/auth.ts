import {createClient} from '@/shared/lib/supabase/server'
import {cache} from "react";

/**
 * Получает текущего пользователя вместе с профилем.
 * Возвращает null если не залогинен.
 * Использовать в Server Components.
 */
export const getCurrentUser = cache(async () => {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) return null

    return {
        ...user,
        userId: user.id,
        profile,
    }
})

/**
 * Проверка: текущий пользователь — тренер?
 */
export async function isCoach(): Promise<boolean> {
    const user = await getCurrentUser()
    return user?.profile.role === 'coach'
}