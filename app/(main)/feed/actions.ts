'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createPostSchema, createPollSchema } from '@/shared/lib/validations/post'
import type { ActionResult } from '@/shared/lib/actions/types'

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

// ============================================
// СОЗДАНИЕ ПОСТА (ТЕКСТ + ФОТО)
// ============================================
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

    // Загрузка фото
    const files = formData.getAll('photos') as File[]
    const validFiles = files.filter((f) => f.size > 0 && f.size <= 20 * 1024 * 1024)
    const mediaUrls: string[] = []

    for (const file of validFiles) {
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error: uploadError } = await supabase.storage
            .from('post-media')
            .upload(path, file, { contentType: file.type })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            continue
        }

        const { data: urlData } = supabase.storage
            .from('post-media')
            .getPublicUrl(path)

        if (urlData?.publicUrl) {
            mediaUrls.push(urlData.publicUrl)
        }
    }

    const hasMedia = mediaUrls.length > 0
    const postType = hasMedia ? 'media' : 'text'

    const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        title: title || null,
        content,
        post_type: postType,
        media_urls: mediaUrls,
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
    return { success: true }
}

// ============================================
// СОЗДАНИЕ ОПРОСА
// ============================================
export async function createPoll(formData: FormData): Promise<ActionResult> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    // Парсим варианты из FormData
    const optionsRaw = formData.get('poll_options')
    let pollOptions: Array<{ id: string; text: string; votes: number }> = []

    try {
        pollOptions = JSON.parse(optionsRaw as string)
    } catch {
        return { success: false, error: 'Ошибка формата вариантов' }
    }

    const parsed = createPollSchema.safeParse({
        title: formData.get('title'),
        content: formData.get('content'),
        poll_question: formData.get('poll_question'),
        poll_options: pollOptions,
        poll_multiple_choice: formData.get('poll_multiple_choice'),
        is_pinned: formData.get('is_pinned'),
    })

    if (!parsed.success) {
        return {
            success: false,
            error: 'Проверь введённые данные',
            fieldErrors: extractFieldErrors(parsed.error),
        }
    }

    const { title, content, poll_question, poll_options, poll_multiple_choice, is_pinned } = parsed.data

    const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        title: title || null,
        content: content || poll_question,
        post_type: 'poll',
        poll_question,
        poll_options,
        poll_multiple_choice,
        is_pinned,
        pinned_at: is_pinned ? new Date().toISOString() : null,
    })

    if (error) {
        console.error('Failed to create poll:', error)
        if (error.code === '42501') {
            return { success: false, error: 'Только тренер может создавать опросы' }
        }
        return { success: false, error: 'Не удалось создать опрос' }
    }

    revalidatePath('/feed')
    revalidatePath('/home')
    return { success: true }
}

// ============================================
// ГОЛОСОВАНИЕ
// ============================================
export async function votePoll(
    postId: string,
    optionId: string
): Promise<ActionResult> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    // Получаем пост
    const { data: post } = await supabase
        .from('posts')
        .select('poll_options, poll_multiple_choice')
        .eq('id', postId)
        .single()

    if (!post || !post.poll_options) {
        return { success: false, error: 'Опрос не найден' }
    }

    // Проверяем: уже голосовал?
    const { data: existingVotes } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('post_id', postId)
        .eq('user_id', user.id)

    const alreadyVotedThisOption = existingVotes?.some((v) => v.option_id === optionId)

    if (alreadyVotedThisOption) {
        // Снять голос
        const { error: deleteError } = await supabase
            .from('poll_votes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .eq('option_id', optionId)

        if (deleteError) {
            return { success: false, error: 'Не удалось снять голос' }
        }

        // Обновляем счётчик в poll_options
        const options = post.poll_options as Array<{ id: string; text: string; votes: number }>
        const updated = options.map((o) =>
            o.id === optionId ? { ...o, votes: Math.max(0, o.votes - 1) } : o
        )

        await supabase.from('posts').update({ poll_options: updated }).eq('id', postId)

        revalidatePath('/feed')
        revalidatePath(`/feed/${postId}`)
        return { success: true }
    }

    // Если не multiple choice — удаляем старые голоса
    if (!post.poll_multiple_choice && existingVotes && existingVotes.length > 0) {
        for (const v of existingVotes) {
            await supabase
                .from('poll_votes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id)
                .eq('option_id', v.option_id)

            // Декрементим старый вариант
            const options = post.poll_options as Array<{ id: string; text: string; votes: number }>
            const updated = options.map((o) =>
                o.id === v.option_id ? { ...o, votes: Math.max(0, o.votes - 1) } : o
            )
            await supabase.from('posts').update({ poll_options: updated }).eq('id', postId)
        }

        // Перечитываем post после декремента
        const { data: freshPost } = await supabase
            .from('posts')
            .select('poll_options')
            .eq('id', postId)
            .single()

        if (freshPost) {
            post.poll_options = freshPost.poll_options
        }
    }

    // Добавляем голос
    const { error: insertError } = await supabase.from('poll_votes').insert({
        post_id: postId,
        user_id: user.id,
        option_id: optionId,
    })

    if (insertError) {
        return { success: false, error: 'Не удалось проголосовать' }
    }

    // Инкрементим вариант
    const options = post.poll_options as Array<{ id: string; text: string; votes: number }>
    const updated = options.map((o) =>
        o.id === optionId ? { ...o, votes: o.votes + 1 } : o
    )

    await supabase.from('posts').update({ poll_options: updated }).eq('id', postId)

    revalidatePath('/feed')
    revalidatePath(`/feed/${postId}`)
    return { success: true }
}

// ============================================
// УДАЛЕНИЕ / ЗАКРЕПЛЕНИЕ / РЕАКЦИИ / КОММЕНТАРИИ
// ============================================
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

export async function toggleReaction(
    postId: string,
    emoji: string
): Promise<ActionResult<{ added: boolean }>> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    const { data: existing } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle()

    if (existing) {
        const { error } = await supabase
            .from('post_reactions')
            .delete()
            .eq('id', existing.id)

        if (error) {
            return { success: false, error: 'Не удалось убрать реакцию' }
        }

        await supabase.rpc('decrement_reactions_count', { p_post_id: postId })

        revalidatePath('/feed')
        return { success: true, data: { added: false } }
    } else {
        const { error } = await supabase.from('post_reactions').insert({
            post_id: postId,
            user_id: user.id,
            emoji,
        })

        if (error) {
            return { success: false, error: 'Не удалось поставить реакцию' }
        }

        await supabase.rpc('increment_reactions_count', { p_post_id: postId })

        revalidatePath('/feed')
        return { success: true, data: { added: true } }
    }
}

export async function addComment(
    postId: string,
    content: string,
    parentCommentId?: string
): Promise<ActionResult> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Нужно войти в аккаунт' }
    }

    const trimmed = content.trim()
    if (!trimmed || trimmed.length > 2000) {
        return { success: false, error: 'Комментарий должен быть от 1 до 2000 символов' }
    }

    const { error } = await supabase.from('post_comments').insert({
        post_id: postId,
        author_id: user.id,
        content: trimmed,
        parent_comment_id: parentCommentId || null,
    })

    if (error) {
        return { success: false, error: 'Не удалось добавить комментарий' }
    }

    await supabase.rpc('increment_comments_count', { p_post_id: postId })

    revalidatePath(`/feed/${postId}`)
    revalidatePath('/feed')
    return { success: true }
}

export async function deleteComment(
    commentId: string,
    postId: string
): Promise<ActionResult> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)

    if (error) {
        if (error.code === '42501') {
            return { success: false, error: 'Нет прав на удаление' }
        }
        return { success: false, error: 'Не удалось удалить комментарий' }
    }

    await supabase.rpc('decrement_comments_count', { p_post_id: postId })

    revalidatePath(`/feed/${postId}`)
    revalidatePath('/feed')
    return { success: true }
}