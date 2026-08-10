import { getNextTripWithParticipants } from '@/app/(main)/home/queries'
import { NextTripCard } from '../next-trip-card'

type Props = {
    userId: string
}

export async function NextTripBlock({ userId }: Props) {
    const trip = await getNextTripWithParticipants(userId)
    if (!trip) return null

    return <NextTripCard trip={trip} currentUserId={userId} />
}