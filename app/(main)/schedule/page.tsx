import { getCurrentUser } from '@/shared/lib/auth'
import { getTrainingsInRange } from './queries'
import { ScheduleCalendar } from '@/components/schedule/schedule-calendar'
import { ScheduleCoachPanel } from '@/components/schedule/schedule-coach-panel'
import { EmptyState } from '@/components/shared/empty-state'
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns'

export default async function SchedulePage() {
    const user = await getCurrentUser()
    if (!user) return null

    const start = startOfMonth(new Date())
    const end = endOfMonth(addMonths(new Date(), 2))

    const trainings = await getTrainingsInRange(
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd'),
        user.userId
    )

    const isCoach = user.profile.role === 'coach'

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold text-white">Расписание</h1>

            {trainings.length === 0 ? (
                <EmptyState
                    icon="📅"
                    title="Тренировок нет"
                    description={
                        isCoach
                            ? 'Расписание генерируется автоматически'
                            : 'Расписание появится когда тренер его создаст'
                    }
                />
            ) : (
                <>
                    {isCoach && <ScheduleCoachPanel trainings={trainings} />}
                    <ScheduleCalendar trainings={trainings} isCoach={isCoach} />
                </>
            )}
        </div>
    )
}