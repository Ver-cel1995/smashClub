import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/shared/lib/auth'
import { ScheduleNoteBlock } from '@/components/home/blocks/schedule-note-block'
import { NextTrainingBlock } from '@/components/home/blocks/next-training-block'
import { NextTripBlock } from '@/components/home/blocks/next-trip-block'
import { RepairBlock } from '@/components/home/blocks/repair-block'
import { PinnedPostBlock } from '@/components/home/blocks/pinned-post-block'
import {
    TrainingCardSkeleton,
    PostCardSkeleton,
} from '@/components/home/skeletons'
import {NextTournamentBlock} from "@/components/home/blocks/next-tournament-block";

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    const isCoach = user.profile.role === 'coach'

    return (
        <div data-tour="home-main" className="flex flex-col gap-3 p-4 pb-safe-nav">
            <Suspense fallback={null}>
                <ScheduleNoteBlock />
            </Suspense>

            <Suspense fallback={<TrainingCardSkeleton />}>
                <NextTrainingBlock userId={user.userId} />
            </Suspense>

            <Suspense fallback={<TrainingCardSkeleton />}>
                <NextTournamentBlock />
            </Suspense>

            <Suspense fallback={null}>
                <NextTripBlock userId={user.userId} />
            </Suspense>

            <Suspense fallback={null}>
                <RepairBlock userId={user.userId} isCoach={isCoach} />
            </Suspense>

            <Suspense fallback={<PostCardSkeleton />}>
                <PinnedPostBlock />
            </Suspense>
        </div>
    )
}