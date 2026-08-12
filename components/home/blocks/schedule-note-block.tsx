import {
    getActiveCoachAnnouncement,
    getUpcomingAffectedTraining,
} from '@/app/(main)/home/queries'
import { ScheduleNoteCard } from '../schedule-note-card'

export async function ScheduleNoteBlock() {
    const [announcement, affectedTraining] = await Promise.all([
        getActiveCoachAnnouncement(),
        getUpcomingAffectedTraining(),
    ])

    if (!announcement && !affectedTraining) return null

    return (
        <ScheduleNoteCard
            announcement={announcement}
            affectedTraining={affectedTraining}
        />
    )
}