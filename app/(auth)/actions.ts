'use server'

import {createClient} from '@/shared/lib/supabase/server'
import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {signInSchema, signUpSchema} from '@/shared/lib/validations/auth'
import type {ActionResult} from '@/shared/lib/actions/types'

/**
 * Преобразует ZodError в объект { field: message }
 */
function extractFieldErrors(error: unknown): Record<string, string> {
    if (
        typeof error === 'object' &&
        error !== null &&
        'issues' in error &&
        Array.isArray((error as { issues: unknown[] }).issues)
    ) {
        const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues
        return issues.reduce((acc, issue) => {
            const field = issue.path[0]?.toString() || '_'
            if (!acc[field]) acc[field] = issue.message
            return acc
        }, {} as Record<string, string>)
    }
    return {}
}

export async function signIn(formData: FormData): Promise<ActionResult> {
    // 1. Валидация
    const parsed = signInSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
    })

    if (!parsed.success) {
        return {
            success: false,
            error: 'Проверь введённые данные',
            fieldErrors: extractFieldErrors(parsed.error),
        }
    }

    // 2. Вход в Supabase
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword(parsed.data)

    if (error) {
        if (error.message.includes('Invalid login credentials')) {
            return { success: false, error: 'Неверный email или пароль' }
        }
        if (error.message.includes('Email not confirmed')) {
            return { success: false, error: 'Подтверди email по ссылке из письма' }
        }
        return { success: false, error: error.message }
    }

    // 3. Успех — редирект
    revalidatePath('/', 'layout')
    redirect('/home')
}

export async function signUp(formData: FormData): Promise<ActionResult> {
    // 1. Валидация
    const parsed = signUpSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        name: formData.get('name'),
    })

    if (!parsed.success) {
        return {
            success: false,
            error: 'Проверь введённые данные',
            fieldErrors: extractFieldErrors(parsed.error),
        }
    }

    const { email, password, name } = parsed.data

    // 2. Регистрация в Supabase
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: name },
        },
    })

    if (error) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
            return {
                success: false,
                error: 'Пользователь с таким email уже существует',
                fieldErrors: { email: 'Этот email занят' },
            }
        }
        return { success: false, error: error.message }
    }

    // 3. Успех — редирект
    revalidatePath('/', 'layout')
    redirect('/home')
}