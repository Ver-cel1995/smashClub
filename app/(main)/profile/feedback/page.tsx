import { getCurrentUser } from '@/shared/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquarePlus, ShieldCheck } from 'lucide-react'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { MyFeedbackList } from '@/components/feedback/my-feedback-list'
import { getMyFeedback } from './actions'

export default async function FeedbackPage() {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    const myFeedback = await getMyFeedback()
    const isDev = user.profile.role === 'development'

    return (
        <div className="space-y-4 p-4 pb-8">
            <Link
                href="/profile"
                className="inline-flex items-center gap-2 text-sm text-muted hover:text-strong"
            >
                <ArrowLeft className="h-4 w-4" />
                Профиль
            </Link>

            <div className="flex items-center gap-3">
                <div className="rounded-full bg-accent-muted p-2">
                    <MessageSquarePlus className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-strong">Идеи и баги</h1>
                    <p className="text-sm text-muted mt-0.5">
                        Расскажи что улучшить или что сломалось
                    </p>
                </div>
            </div>

            {isDev && (
                <Link
                    href="/profile/feedback/admin"
                    className="flex items-center gap-2 rounded-2xl border border-accent bg-accent-muted px-3 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-[var(--accent-foreground)]"
                >
                    <ShieldCheck className="h-4 w-4" />
                    Админка обращений
                </Link>
            )}

            <FeedbackForm />

            {myFeedback.length > 0 && (
                <div className="space-y-2 pt-4">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
                        Мои обращения ({myFeedback.length})
                    </h2>
                    <MyFeedbackList feedback={myFeedback} />
                </div>
            )}
        </div>
    )
}