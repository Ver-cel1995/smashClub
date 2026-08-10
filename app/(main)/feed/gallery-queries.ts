import 'server-only'
import { createClient } from '@/shared/lib/supabase/server'
import { startOfMonth, endOfMonth } from 'date-fns'

export type GalleryPostGroup = {
    postId: string
    postTitle: string | null
    createdAt: string
    images: string[]
}

export type GalleryFilters = {
    month?: number
}

const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)($|\?)/i

export async function getGalleryGroups(
    filters: GalleryFilters = {}
): Promise<GalleryPostGroup[]> {
    const supabase = await createClient()

    let query = supabase
        .from('posts')
        .select('id, title, created_at, media_urls')
        .not('media_urls', 'is', null)
        .in('post_type', ['text', 'media'])
        .order('created_at', { ascending: false })
        .limit(200)

    if (filters.month) {
        const year = new Date().getFullYear()
        const monthStart = startOfMonth(new Date(year, filters.month - 1, 1))
        const monthEnd = endOfMonth(monthStart)
        query = query
            .gte('created_at', monthStart.toISOString())
            .lte('created_at', monthEnd.toISOString())
    }

    const { data, error } = await query

    if (error) {
        console.error('[getGalleryGroups]', error)
        return []
    }

    const groups: GalleryPostGroup[] = []
    for (const p of data ?? []) {
        const images = (p.media_urls ?? []).filter((url: string) => IMAGE_RE.test(url))
        if (images.length === 0) continue
        groups.push({
            postId: p.id,
            postTitle: p.title,
            createdAt: p.created_at,
            images,
        })
    }
    return groups
}