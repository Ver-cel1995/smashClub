import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/shared/lib/auth'
import { redirect } from 'next/navigation'
import { getTraining, getTrainingComments, getAllClubPlayers } from '../queries'
import { TrainingPageHeader } from '@/components/schedule/training-page-header'
import { TrainingAttendanceButtons } from '@/components/schedule/training-attendance-buttons'
import { TrainingAttendanceLists } from '@/components/schedule/training-attendance-lists'
import { TrainingCommentsSection } from '@/components/schedule/training-comments-section'
import {buildTrainingShareData} from "@/shared/lib/share";
import {ShareButton} from "@/components/shared/share-button";

export default async function TrainingPage({
                                               params,
                                           }: {
    params: Promise<{ trainingId: string }>
}) {
    const { trainingId } = await params

    // Виртуальные турниры (id формата virtual-...) — не поддерживаем
    if (trainingId.startsWith('virtual-')) {
        notFound()
    }

    const user = await getCurrentUser()
    if (!user) redirect('/login')

    const [training, comments, allPlayers] = await Promise.all([
        getTraining(trainingId, user.userId),
        getTrainingComments(trainingId),
        getAllClubPlayers(),
    ])

    if (!training) notFound()

    const isCoach = user.profile.role === 'coach' || user.profile.role === 'development'

    return (
        <div className="space-y-4 p-4 pb-8">

            {typeof window !== 'undefined' && (
                <ShareButton
                    data={buildTrainingShareData(training, window.location.origin)}
                />
            )}
            <TrainingPageHeader training={training} />

            {/* Кнопки "Приду / Не приду" — только для игроков */}
            {!isCoach && (
                <TrainingAttendanceButtons
                    trainingId={training.id}
                    initialStatus={training.my_status}
                />
            )}

            <TrainingAttendanceLists
                attendance={training.attendance}
                allPlayers={allPlayers}
                currentUserId={user.userId}
            />

            <TrainingCommentsSection
                trainingId={training.id}
                comments={comments}
                currentUserId={user.userId}
                isCoach={isCoach}
            />
        </div>
    )
}