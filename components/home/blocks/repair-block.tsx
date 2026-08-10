import {
    getRepairForPlayer,
    getRepairForCoach,
} from '@/app/(main)/home/queries'
import { RepairCardPlayer } from '../repair-card-player'
import { RepairCardCoach } from '../repair-card-coach'

type Props = {
    userId: string
    isCoach: boolean
}

export async function RepairBlock({ userId, isCoach }: Props) {
    if (isCoach) {
        const data = await getRepairForCoach()
        if (!data) return null
        return <RepairCardCoach data={data} />
    }

    const data = await getRepairForPlayer(userId)
    if (!data) return null
    return <RepairCardPlayer data={data} />
}