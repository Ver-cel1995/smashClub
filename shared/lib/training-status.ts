import type { TrainingStatus } from '@/types'

export const TRAINING_STATUS_META: Record<
    TrainingStatus,
    {
        label: string
        shortLabel: string
        icon: string
        color: string
        bgColor: string
        borderColor: string
        dotColor: string
    }
> = {
    normal: {
        label: 'Тренировка по расписанию',
        shortLabel: 'Обычная',
        icon: '🏸',
        color: 'text-accent',
        bgColor: 'bg-accent-muted',
        borderColor: 'border-accent',
        dotColor: 'bg-accent',
    },
    no_coach_open: {
        label: 'Тренера не будет, зал открыт',
        shortLabel: 'Без тренера',
        icon: '🔓',
        color: 'text-amber-300',
        bgColor: 'bg-amber-300/10',
        borderColor: 'border-amber-300/30',
        dotColor: 'bg-amber-300',
    },
    substitute: {
        label: 'Замена тренера',
        shortLabel: 'Замена',
        icon: '👤',
        color: 'text-teal-400',
        bgColor: 'bg-teal-400/10',
        borderColor: 'border-teal-400/30',
        dotColor: 'bg-teal-400',
    },
    cancelled: {
        label: 'Тренировка отменена',
        shortLabel: 'Отменена',
        icon: '❌',
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        borderColor: 'border-red-400/30',
        dotColor: 'bg-red-400',
    },
    holiday: {
        label: 'Праздничный день',
        shortLabel: 'Праздник',
        icon: '🎉',
        color: 'text-purple-400',
        bgColor: 'bg-purple-400/10',
        borderColor: 'border-purple-400/30',
        dotColor: 'bg-purple-400',
    },
    tournament_trip: {
        label: 'На турнире',
        shortLabel: 'Турнир',
        icon: '🏆',
        color: 'text-rose-400',
        bgColor: 'bg-rose-400/10',
        borderColor: 'border-rose-400/30',
        dotColor: 'bg-rose-400',
    },
}