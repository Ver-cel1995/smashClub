import { createClient } from '@/shared/lib/supabase/server'
import type { Profile, Post, PostComment } from '@/types'
import { cache } from 'react'

export type PostWithAuthor = Post & {
    author: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'>
}

export type CommentWithAuthor = PostComment & {
    author: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'>
}

export type ReactionGroup = {
    emoji: string
    count: number
    reacted: boolean
}

const POST_SELECT = '*, author:author_id(id, full_name, avatar_url, role)'

export const getPosts = cache(async (): Promise<PostWithAuthor[]> => {
    const supabase = await createClient()
    const nowIso = new Date().toISOString()

    const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .or(`auto_expires_at.gt.${nowIso},and(post_type.neq.auto,auto_expires_at.is.null)`)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to load posts:', error)
        return []
    }

    return (data as unknown as PostWithAuthor[]) || []
})

export const getPost = cache(async (postId: string): Promise<PostWithAuthor | null> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('id', postId)
        .single()

    if (error) {
        console.error('Failed to load post:', error)
        return null
    }

    return data as unknown as PostWithAuthor
})

/**
 * Загружает реакции для массива постов одним запросом.
 * Поддерживает гостевой режим (currentUserId может быть null / undefined)
 */
export const getReactionsForPosts = cache(async (
    postIds: string[],
    currentUserId?: string | null
): Promise<Map<string, ReactionGroup[]>> => {
    const result = new Map<string, ReactionGroup[]>()
    if (postIds.length === 0) return result

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('post_reactions')
        .select('post_id, emoji, user_id')
        .in('post_id', postIds)

    if (error || !data) {
        postIds.forEach((id) => result.set(id, []))
        return result
    }

    // Группируем по post_id → emoji
    const grouped = new Map<string, Map<string, { count: number; reacted: boolean }>>()

    for (const r of data) {
        if (!grouped.has(r.post_id)) {
            grouped.set(r.post_id, new Map())
        }
        const postMap = grouped.get(r.post_id)!
        const existing = postMap.get(r.emoji)

        const isMyReaction = Boolean(currentUserId && r.user_id === currentUserId)

        if (existing) {
            existing.count++
            if (isMyReaction) existing.reacted = true
        } else {
            postMap.set(r.emoji, {
                count: 1,
                reacted: isMyReaction,
            })
        }
    }

    for (const postId of postIds) {
        const postMap = grouped.get(postId)
        if (!postMap) {
            result.set(postId, [])
            continue
        }
        result.set(
            postId,
            Array.from(postMap.entries()).map(([emoji, info]) => ({
                emoji,
                ...info,
            }))
        )
    }

    return result
})

export const getPostReactions = cache(async (
    postId: string,
    currentUserId?: string | null
): Promise<ReactionGroup[]> => {
    const map = await getReactionsForPosts([postId], currentUserId)
    return map.get(postId) || []
})

export const getPostComments = cache(async (
    postId: string
): Promise<CommentWithAuthor[]> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('post_comments')
        .select('*, author:author_id(id, full_name, avatar_url, role)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Failed to load comments:', error)
        return []
    }

    return (data as unknown as CommentWithAuthor[]) || []
})

export const getUserVotes = cache(async (
    postId: string,
    userId?: string | null
): Promise<string[]> => {
    if (!userId) return []

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('post_id', postId)
        .eq('user_id', userId)

    if (error || !data) return []

    return data.map((v) => v.option_id)
})

/**
 * Загружает голоса для массива постов-опросов одним запросом.
 * Для гостя (userId == null) сразу возвращает пустую карту без запроса в БД.
 */
export const getVotesForPosts = cache(async (
    postIds: string[],
    userId?: string | null
): Promise<Map<string, string[]>> => {
    const result = new Map<string, string[]>()
    if (postIds.length === 0 || !userId) {
        postIds.forEach((id) => result.set(id, []))
        return result
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('poll_votes')
        .select('post_id, option_id')
        .in('post_id', postIds)
        .eq('user_id', userId)

    if (error || !data) {
        postIds.forEach((id) => result.set(id, []))
        return result
    }

    for (const v of data) {
        const existing = result.get(v.post_id) || []
        existing.push(v.option_id)
        result.set(v.post_id, existing)
    }

    return result
})