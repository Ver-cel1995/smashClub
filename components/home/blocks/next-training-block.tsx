import {getNextTrainingWithAttendance} from '@/app/(main)/home/queries'
import {NextTrainingCard} from '../next-training-card'

export async function NextTrainingBlock({userId}: { userId: string }) {
    const training = await getNextTrainingWithAttendance(userId)
    if (!training) return null
    return (
        <div data-tour="home-next-training">
            <NextTrainingCard training={training} currentUserId={userId}/>
        </div>
    )


}