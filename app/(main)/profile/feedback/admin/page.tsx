import { getCurrentUser } from '@/shared/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { AdminFeedbackList } from '@/components/feedback/admin-feedback-list'
import { getAllFeedback } from '../actions'

export default async function FeedbackAdminPage() {
    const user = await getCurrentUser()
    if (!user) redirect('/login')
    if (user.profile.role !== 'development') redirect('/profile/feedback')

    const allFeedback = await getAllFeedback()

    return (
        <div className="space-y-4 p-4 pb-8">
            <Link
                href="/profile/feedback"
                className="inline-flex items-center gap-2 text-sm text-muted hover:text-strong"
            >
                <ArrowLeft className="h-4 w-4" />
                Мои обращения
            </Link>

            <div className="flex items-center gap-3">
                <div className="rounded-full bg-accent-muted p-2">
                    <ShieldCheck className="h-5 w-5 text-accent" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-strong">Все обращения</h1>
                    <p className="text-sm text-muted mt-0.5">
                        Всего: {allFeedback.length}
                    </p>
                </div>
            </div>

            <AdminFeedbackList feedback={allFeedback} />
        </div>
    )
}