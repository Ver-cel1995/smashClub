'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/shared/lib/supabase/server'
import { getCurrentUser } from '@/shared/lib/auth'
import type { ActionResult } from '@/shared/lib/actions/types'

const CITIES = ['kushchevskaya', 'rostov', 'krasnodar', 'other'] as const

const UpdateProfileSchema = z.object({
    full_name: z.string().min(2, 'Минимум 2 символа').max(50),
    city: z.enum(CITIES).optional().nullable(),
    avatar_url: z.string().url().optional().nullable(),
    gender: z.enum(['male', 'female']).nullable().optional()
})

export async function updateProfile(formData: FormData): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Не авторизован' }

    const parsed = UpdateProfileSchema.safeParse({
        full_name: formData.get('full_name'),
        city: formData.get('city') || null,
        avatar_url: formData.get('avatar_url') || null,
        gender: formData.get('gender') || null,   // ← НОВОЕ
    })

    if (!parsed.success) {
        const fieldErrors: Record<string, string> = {}
        for (const issue of parsed.error.issues) {
            fieldErrors[issue.path[0] as string] = issue.message
        }
        return { success: false, error: 'Проверьте поля', fieldErrors }
    }

    const supabase = await createClient()

    // Убирает undefined поля (если gender не пришёл — не перезаписываем существующий)
    const updatePayload: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(parsed.data)) {
        if (value !== undefined) {
            updatePayload[key] = value
        }
    }

    const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.userId)

    if (error) {
        console.error('[updateProfile]', error)
        return { success: false, error: 'Не удалось обновить профиль' }
    }

    revalidatePath('/profile')
    revalidatePath('/profile/settings')
    revalidatePath('/', 'layout')  // чтобы layout перечитал user.profile.gender
    return { success: true }
}

export async function signOutAction(): Promise<ActionResult> {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    if (error) return { success: false, error: error.message }
    return { success: true }
}

const updateGenderSchema = z.object({
    gender: z.enum(['male', 'female']),
})

export async function updateMyGender(
    gender: 'male' | 'female'
): Promise<ActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    const parsed = updateGenderSchema.safeParse({ gender })
    if (!parsed.success) {
        return { success: false, error: 'Неверные данные' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ gender: parsed.data.gender })
        .eq('id', user.id)

    if (error) {
        console.error('Failed to update gender:', error)
        return { success: false, error: 'Не удалось сохранить' }
    }

    revalidatePath('/', 'layout')  // перерисуем все страницы
    return { success: true }
}

// Тренер может обновить пол любого игрока
export async function updatePlayerGender(
    playerId: string,
    gender: 'male' | 'female'
): Promise<ActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'coach') {
        return { success: false, error: 'Только тренер' }
    }

    const parsed = updateGenderSchema.safeParse({ gender })
    if (!parsed.success) {
        return { success: false, error: 'Неверные данные' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ gender: parsed.data.gender })
        .eq('id', playerId)

    if (error) {
        return { success: false, error: 'Не удалось сохранить' }
    }

    revalidatePath('/people')
    return { success: true }
}