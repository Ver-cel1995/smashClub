import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/shared/lib/auth'
import {
    getActiveCoachAnnouncement,
    getUpcomingAffectedTraining,
    getNextTrainingWithAttendance,
    getNextTripWithParticipants,
    getRepairForPlayer,
    getRepairForCoach,
    getHomeFeedPost,
} from './queries'
import { ScheduleNoteCard } from '@/components/home/schedule-note-card'
import { NextTrainingCard } from '@/components/home/next-training-card'
import { NextTripCard } from '@/components/home/next-trip-card'
import { RepairCardPlayer } from '@/components/home/repair-card-player'
import { RepairCardCoach } from '@/components/home/repair-card-coach'
import { PinnedFeedCard } from '@/components/home/pinned-feed-card'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    // const attendance = (training.attendance ?? []) as any[]

    const isCoach = user.profile.role === 'coach'

    const [
        announcement,
        affectedTraining,
        training,
        trip,
        repairPlayer,
        repairCoach,
        homePost,
    ] = await Promise.all([
        getActiveCoachAnnouncement(),
        getUpcomingAffectedTraining(),
        getNextTrainingWithAttendance(user.userId),
        getNextTripWithParticipants(user.userId),
        isCoach ? Promise.resolve(null) : getRepairForPlayer(user.userId),
        isCoach ? getRepairForCoach() : Promise.resolve(null),
        getHomeFeedPost(),
    ])

    return (
        <div className="flex flex-col gap-3 p-4 pb-24">
            <ScheduleNoteCard
                announcement={announcement}
                affectedTraining={affectedTraining}
            />

            {training && (
                <NextTrainingCard training={training} currentUserId={user.userId} />
            )}

            {trip && <NextTripCard trip={trip} currentUserId={user.userId} />}

            {!isCoach && repairPlayer && <RepairCardPlayer data={repairPlayer} />}
            {isCoach && repairCoach && <RepairCardCoach data={repairCoach} />}

            {homePost && <PinnedFeedCard post={homePost} />}
        </div>
    )
}