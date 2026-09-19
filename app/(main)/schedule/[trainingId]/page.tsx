import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/shared/lib/auth'
import { getTraining, getTrainingComments, getAllClubPlayers } from '../queries'
import { TrainingPageHeader } from '@/components/schedule/training-page-header'
import { TrainingAttendanceButtons } from '@/components/schedule/training-attendance-buttons'
import { TrainingAttendanceLists } from '@/components/schedule/training-attendance-lists'
import { TrainingCommentsSection } from '@/components/schedule/training-comments-section'
import { TrainingShareButton } from '@/components/schedule/training-share-button'

export default async function TrainingPage({
                                               params,
                                           }: {
    params: Promise<{ trainingId: string }>
}) {
    const { trainingId } = await params

    if (trainingId.startsWith('virtual-')) {
        notFound()
    }

    const user = await getCurrentUser()
    if (!user) redirect('/login')

    const [training, comments, allPlayers] = await Promise.all([
        getTraining(trainingId, user.id),
        getTrainingComments(trainingId),
        getAllClubPlayers(),
    ])

    if (!training) notFound()

    const isCoach = user.profile.role === 'coach' || user.profile.role === 'development'

    return (
        <div className="space-y-4 p-4 pb-8">
            <div className="flex justify-end">
                <TrainingShareButton training={training} />
            </div>

            <TrainingPageHeader training={training} />

            {!isCoach && (
                <TrainingAttendanceButtons
                    trainingId={training.id}
                    initialStatus={training.my_status}
                />
            )}

            <TrainingAttendanceLists
                attendance={training.attendance}
                allPlayers={allPlayers}
                currentUserId={user.id}
            />

            <TrainingCommentsSection
                trainingId={training.id}
                comments={comments}
                currentUserId={user.id}
                isCoach={isCoach}
            />
        </div>
    )
}