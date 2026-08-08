import { getCurrentUser } from '@/shared/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getPost } from '../queries'
import { PostCard } from '@/components/feed/post-card'

interface Props {
    params: Promise<{ id: string }>
}

export default async function PostDetailPage({ params }: Props) {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) return null

    const post = await getPost(id)
    if (!post) notFound()

    const isCoach = user.profile.role === 'coach'

    return (
        <div className="p-4 space-y-4">
            {/* Шапка */}
            <div className="flex items-center gap-3">
                <Link
                    href="/feed"
                    className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors -ml-2"
                    aria-label="Назад"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-bold text-white">Пост</h1>
            </div>

            {/* Пост целиком */}
            <PostCard post={post} isCoach={isCoach} full />

            {/* Заглушка комментариев */}
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
                <p className="text-sm text-neutral-500">
                    💬 Комментарии появятся в следующем этапе
                </p>
            </section>
        </div>
    )
}