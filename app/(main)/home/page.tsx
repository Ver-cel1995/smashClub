import {Suspense} from 'react'
import {getCurrentUser} from '@/shared/lib/auth'
import {ScheduleNoteBlock} from '@/components/home/blocks/schedule-note-block'
import {NextTrainingBlock} from '@/components/home/blocks/next-training-block'
import {NextTripBlock} from '@/components/home/blocks/next-trip-block'
import {RepairBlock} from '@/components/home/blocks/repair-block'
import {PinnedPostBlock} from '@/components/home/blocks/pinned-post-block'
import {PostCardSkeleton, TrainingCardSkeleton,} from '@/components/home/skeletons'
import {NextTournamentBlock} from "@/components/home/blocks/next-tournament-block";
import {GuestRestricted} from "@/components/shared/guest-restricted";

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const user = await getCurrentUser()
    if (!user) {
        return <GuestRestricted title="Главный экран доступен участникам клуба" />;
    }

    const isCoach = user.profile.role === 'coach'

    return (
        <div data-tour="home-main" className="flex flex-col gap-3 p-4 pb-safe-nav">
            <Suspense fallback={null}>
                <ScheduleNoteBlock />
            </Suspense>

            <Suspense fallback={<TrainingCardSkeleton />}>
                <NextTrainingBlock userId={user.id} />
            </Suspense>

            <Suspense fallback={<TrainingCardSkeleton />}>
                <NextTournamentBlock />
            </Suspense>

            <Suspense fallback={null}>
                <NextTripBlock userId={user.id} />
            </Suspense>

            <Suspense fallback={null}>
                <RepairBlock userId={user.id} isCoach={isCoach} />
            </Suspense>

            <Suspense fallback={<PostCardSkeleton />}>
                <PinnedPostBlock />
            </Suspense>
        </div>
    )
}