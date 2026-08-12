import { getNextTrainingWithAttendance } from '@/app/(main)/home/queries'
import { NextTrainingCard } from '../next-training-card'

export async function NextTrainingBlock({ userId }: { userId: string }) {
    const training = await getNextTrainingWithAttendance(userId)
    if (!training) return null
    return <NextTrainingCard training={training} currentUserId={userId} />
}