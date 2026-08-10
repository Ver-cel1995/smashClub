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
})

export async function updateProfile(formData: FormData): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Не авторизован' }

    const parsed = UpdateProfileSchema.safeParse({
        full_name: formData.get('full_name'),
        city: formData.get('city') || null,
        avatar_url: formData.get('avatar_url') || null,
    })

    if (!parsed.success) {
        const fieldErrors: Record<string, string> = {}
        for (const issue of parsed.error.issues) {
            fieldErrors[issue.path[0] as string] = issue.message
        }
        return { success: false, error: 'Проверьте поля', fieldErrors }
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update(parsed.data)
        .eq('id', user.userId)

    if (error) {
        console.error('[updateProfile]', error)
        return { success: false, error: 'Не удалось обновить профиль' }
    }

    revalidatePath('/profile')
    revalidatePath('/profile/settings')
    return { success: true }
}

export async function signOutAction(): Promise<ActionResult> {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    if (error) return { success: false, error: error.message }
    return { success: true }
}