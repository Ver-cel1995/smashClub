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

export type FeedPage = {
    posts: PostWithAuthor[]
    nextCursor: string | null
}

const POST_SELECT = '*, author:author_id(id, full_name, avatar_url, role)'

export async function getFeedPage({cursor,limit = 20 }: {cursor?: string | null
    limit?: number } = {}): Promise<FeedPage> {
    const supabase = await createClient()
    const nowIso = new Date().toISOString()
    const visibility = `auto_expires_at.gt.${nowIso},and(post_type.neq.auto,auto_expires_at.is.null)`

    let query = supabase
        .from('posts')
        .select(POST_SELECT)
        .or(visibility)
        .eq('is_pinned', false)
        .order('created_at', { ascending: false })
        .limit(limit + 1)

    if (cursor) {
        query = query.lt('created_at', cursor)
    }

    const [regularRes, pinnedRes] = await Promise.all([
        query,
        cursor
            ? Promise.resolve({ data: [] as unknown[], error: null })
            : supabase
                .from('posts')
                .select(POST_SELECT)
                .or(visibility)
                .eq('is_pinned', true)
                .order('created_at', { ascending: false }),
    ])

    if (regularRes.error) {
        console.error('Failed to load posts:', regularRes.error)
        return { posts: [], nextCursor: null }
    }

    const rows = (regularRes.data ?? []) as unknown as PostWithAuthor[]
    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const pinned = (pinnedRes.data ?? []) as unknown as PostWithAuthor[]

    return {
        posts: [...pinned, ...page],
        nextCursor: hasMore ? page[page.length - 1]?.created_at ?? null : null,
    }
}

/** Совместимость: первая страница без курсора. */
export const getPosts = cache(async (): Promise<PostWithAuthor[]> => {
    const { posts } = await getFeedPage({ limit: 20 })
    return posts
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
): Promise<Record<string, ReactionGroup[]>> => {
    const result: Record<string, ReactionGroup[]> = {}
    if (postIds.length === 0) return result

    for (const id of postIds) result[id] = []

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('post_reactions')
        .select('post_id, emoji, user_id')
        .in('post_id', postIds)

    if (error || !data) return result

    const grouped: Record<string, Record<string, ReactionGroup>> = {}

    for (const r of data) {
        const byEmoji = (grouped[r.post_id] ??= {})
        const isMine = Boolean(currentUserId && r.user_id === currentUserId)
        const existing = byEmoji[r.emoji]

        if (existing) {
            existing.count += 1
            if (isMine) existing.reacted = true
        } else {
            byEmoji[r.emoji] = { emoji: r.emoji, count: 1, reacted: isMine }
        }
    }

    for (const postId of postIds) {
        const byEmoji = grouped[postId]
        result[postId] = byEmoji ? Object.values(byEmoji) : []
    }

    return result
})

export const getPostReactions = cache(async (
    postId: string,
    currentUserId?: string | null
): Promise<ReactionGroup[]> => {
    const map = await getReactionsForPosts([postId], currentUserId)
    return map[postId] ?? []
})

/**
 * Загружает голоса для массива постов-опросов одним запросом.
 * Для гостя (userId == null) сразу возвращает пустую карту без запроса в БД.
 */

export const getVotesForPosts = cache(async (
    postIds: string[],
    userId?: string | null
): Promise<Record<string, string[]>> => {
    const result: Record<string, string[]> = {}
    for (const id of postIds) result[id] = []

    if (postIds.length === 0 || !userId) return result

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('poll_votes')
        .select('post_id, option_id')
        .in('post_id', postIds)
        .eq('user_id', userId)

    if (error || !data) return result

    for (const v of data) {
        (result[v.post_id] ??= []).push(v.option_id)
    }

    return result
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