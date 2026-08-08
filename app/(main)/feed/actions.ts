'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createPostSchema } from '@/shared/lib/validations/post'
import type { ActionResult } from '@/shared/lib/actions/types'

/**
 * Извлекает field-level ошибки из ZodError.
 * TODO: вынести в общий хелпер lib/actions/utils.ts когда появится 2й использователь.
 */
function extractFieldErrors(error: unknown): Record<string, string> {
    if (
        typeof error === 'object' &&
        error !== null &&
        'issues' in error &&
        Array.isArray((error as { issues: unknown[] }).issues)
    ) {
        const issues = (error as {
            issues: Array<{ path: (string | number)[]; message: string }>
        }).issues
        return issues.reduce((acc, issue) => {
            const field = issue.path[0]?.toString() || '_'
            if (!acc[field]) acc[field] = issue.message
            return acc
        }, {} as Record<string, string>)
    }
    return {}
}

/**
 * Создание поста.
 * Только для тренера (проверка через RLS в Supabase).
 */
export async function createPost(formData: FormData): Promise<ActionResult> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    const parsed = createPostSchema.safeParse({
        title: formData.get('title'),
        content: formData.get('content'),
        is_pinned: formData.get('is_pinned'),
    })

    if (!parsed.success) {
        return {
            success: false,
            error: 'Проверь введённые данные',
            fieldErrors: extractFieldErrors(parsed.error),
        }
    }

    const { title, content, is_pinned } = parsed.data

    const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        title: title || null,
        content,
        post_type: 'text',
        is_pinned,
        pinned_at: is_pinned ? new Date().toISOString() : null,
    })

    if (error) {
        console.error('Failed to create post:', error)
        if (error.code === '42501') {
            return { success: false, error: 'Только тренер может создавать посты' }
        }
        return { success: false, error: 'Не удалось создать пост' }
    }

    revalidatePath('/feed')
    revalidatePath('/home')

    // Возвращаем success — редирект будет на клиенте
    return { success: true }
}

/**
 * Удаление поста.
 */
export async function deletePost(postId: string): Promise<ActionResult> {
    const supabase = await createClient()

    const { error } = await supabase.from('posts').delete().eq('id', postId)

    if (error) {
        console.error('Failed to delete post:', error)
        if (error.code === '42501') {
            return { success: false, error: 'Нет прав на удаление' }
        }
        return { success: false, error: 'Не удалось удалить пост' }
    }

    revalidatePath('/feed')
    revalidatePath('/home')
    return { success: true }
}

/**
 * Переключение закрепления поста.
 */
export async function togglePinPost(
    postId: string,
    isPinned: boolean
): Promise<ActionResult> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('posts')
        .update({
            is_pinned: isPinned,
            pinned_at: isPinned ? new Date().toISOString() : null,
        })
        .eq('id', postId)

    if (error) {
        console.error('Failed to toggle pin:', error)
        return { success: false, error: 'Не удалось изменить закрепление' }
    }

    revalidatePath('/feed')
    revalidatePath('/home')
    return { success: true }
}