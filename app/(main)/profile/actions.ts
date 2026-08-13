'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/shared/lib/supabase/server'
import { getCurrentUser } from '@/shared/lib/auth'
import type { ActionResult } from '@/shared/lib/actions/types'
import type { TourId, OnboardingProgress } from '@/shared/onboarding/types'
import { TOUR_VERSIONS } from '@/shared/onboarding/types'

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











/**
 * Отмечает тур как завершённый.
 */
export async function markTourCompleted(tourId: TourId): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Не авторизован' }

    return updateTourStatus(user.userId, tourId, {
        completed_at: new Date().toISOString(),
        skipped_at: null,
        version: TOUR_VERSIONS[tourId],
    })
}

/**
 * Отмечает тур как пропущенный.
 */
export async function markTourSkipped(tourId: TourId): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Не авторизован' }

    return updateTourStatus(user.userId, tourId, {
        completed_at: null,
        skipped_at: new Date().toISOString(),
        version: TOUR_VERSIONS[tourId],
    })
}

/**
 * Сбрасывает статус тура (например, при нажатии "Показать инструкцию заново").
 */
export async function resetTour(tourId: TourId): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Не авторизован' }

    const supabase = await createClient()

    // Читаем текущий onboarding
    const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding')
        .eq('id', user.userId)
        .single()

    const currentOnboarding = (profile?.onboarding ?? {}) as OnboardingProgress
    const updated = { ...currentOnboarding }
    delete updated[tourId]

    const { error } = await supabase
        .from('profiles')
        .update({ onboarding: updated })
        .eq('id', user.userId)

    if (error) {
        console.error('[resetTour]', error)
        return { success: false, error: 'Не удалось сбросить тур' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

/**
 * Внутренний helper: обновляет статус одного тура в JSONB.
 */
async function updateTourStatus(
    userId: string,
    tourId: TourId,
    newStatus: {
        completed_at: string | null
        skipped_at: string | null
        version: number
    }
): Promise<ActionResult> {
    const supabase = await createClient()

    // Читаем текущий JSONB
    const { data: profile, error: readError } = await supabase
        .from('profiles')
        .select('onboarding')
        .eq('id', userId)
        .single()

    if (readError) {
        console.error('[updateTourStatus] read failed:', readError)
        return { success: false, error: 'Не удалось прочитать профиль' }
    }

    const currentOnboarding = (profile?.onboarding ?? {}) as OnboardingProgress
    const updated: OnboardingProgress = {
        ...currentOnboarding,
        [tourId]: newStatus,
    }

    const { error } = await supabase
        .from('profiles')
        .update({ onboarding: updated })
        .eq('id', userId)

    if (error) {
        console.error('[updateTourStatus] update failed:', error)
        return { success: false, error: 'Не удалось сохранить прогресс' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}