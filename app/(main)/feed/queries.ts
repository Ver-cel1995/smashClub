import { createClient } from '@/shared/lib/supabase/server'
import type { Profile, Post, PostComment } from '@/types'
import {cache} from "react";

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

export async function getPosts(): Promise<PostWithAuthor[]> {
    const supabase = await createClient()
    const nowIso = new Date().toISOString()

    const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .or(
            `post_type.neq.auto,auto_expires_at.gt.${nowIso},and(post_type.eq.auto,auto_expires_at.is.null)`
        )
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to load posts:', error)
        return []
    }

    return (data as unknown as PostWithAuthor[]) || []
}

export async function getPost(postId: string): Promise<PostWithAuthor | null> {
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
}

/**
 * Загружает реакции для массива постов одним запросом.
 * Возвращает Map<postId, ReactionGroup[]>
 */
export async function getReactionsForPosts(
    postIds: string[],
    currentUserId: string
): Promise<Map<string, ReactionGroup[]>> {
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

        if (existing) {
            existing.count++
            if (r.user_id === currentUserId) existing.reacted = true
        } else {
            postMap.set(r.emoji, {
                count: 1,
                reacted: r.user_id === currentUserId,
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
}

export async function getPostReactions(
    postId: string,
    currentUserId: string
): Promise<ReactionGroup[]> {
    const map = await getReactionsForPosts([postId], currentUserId)
    return map.get(postId) || []
}

export async function getPostComments(
    postId: string
): Promise<CommentWithAuthor[]> {
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
}


export async function getUserVotes(
    postId: string,
    userId: string
): Promise<string[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('post_id', postId)
        .eq('user_id', userId)

    if (error || !data) return []

    return data.map((v) => v.option_id)
}

/**
 * Загружает голоса для массива постов-опросов одним запросом
 */
export async function getVotesForPosts(
    postIds: string[],
    userId: string
): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>()
    if (postIds.length === 0) return result

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
}