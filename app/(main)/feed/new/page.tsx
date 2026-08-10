import { getCurrentUser } from '@/shared/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CreatePostForm } from '@/components/feed/create-post-form'
import { CreatePollForm } from '@/components/feed/create-poll-form'

type Props = {
    searchParams: Promise<{ type?: string }>
}

export default async function NewPostPage({ searchParams }: Props) {
    const user = await getCurrentUser()

    if (!user || user.profile.role !== 'coach') {
        redirect('/feed')
    }

    const { type } = await searchParams
    const isPoll = type === 'poll'

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
                <h1 className="text-xl font-bold text-white">
                    {isPoll ? 'Новый опрос' : 'Новый пост'}
                </h1>
            </div>

            {isPoll ? <CreatePollForm /> : <CreatePostForm />}
        </div>
    )
}