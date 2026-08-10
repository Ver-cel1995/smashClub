import { getCurrentUser } from '@/shared/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getPost, getPostReactions, getPostComments, getUserVotes } from '../queries'
import { PostCard } from '@/components/feed/post-card'
import { CommentSection } from '@/components/feed/comment-section'

type Props = {
    params: Promise<{ id: string }>
}

export default async function PostDetailPage({ params }: Props) {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) return null

    const [post, reactions, comments, votedFor] = await Promise.all([
        getPost(id),
        getPostReactions(id, user.userId),
        getPostComments(id),
        getUserVotes(id, user.userId),
    ])

    if (!post) notFound()

    const isCoach = user.profile.role === 'coach'

    return (
        <div className="p-4 space-y-4">
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

            <PostCard
                post={post}
                isCoach={isCoach}
                reactions={reactions}
                votedFor={votedFor}
                full
            />

            <CommentSection
                postId={id}
                comments={comments}
                currentUserId={user.userId}
                isCoach={isCoach}
            />
        </div>
    )
}