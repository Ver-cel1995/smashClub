import { createClient } from '@/shared/lib/supabase/server'
import type { Profile, Post } from '@/types'

export type PostWithAuthor = Post & {
    author: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'>
}

/**
 * Загружает все посты с данными автора.
 * Сортировка: сначала закреплённые, потом по дате.
 */
export async function getPosts(): Promise<PostWithAuthor[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('posts')
        .select(
            `
      *,
      author:author_id (
        id,
        full_name,
        avatar_url,
        role
      )
    `
        )
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to load posts:', error)
        return []
    }

    return (data as unknown as PostWithAuthor[]) || []
}

/**
 * Загружает один пост по ID.
 */
export async function getPost(postId: string): Promise<PostWithAuthor | null> {
    const supabase = await createClient()
    const POST_SELECT = '*, author:author_id(id, full_name, avatar_url, role)'

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