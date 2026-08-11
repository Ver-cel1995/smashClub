export const TRAINING_GROUPS = {
    main: {
        label: 'Основная',
        shortLabel: 'Осн',
        days: 'вт / чт / сб',
        time: '18:00 – 20:00',
        color: 'text-accent',
        bgColor: 'bg-accent-muted',
        borderColor: 'border-accent',
    },
    school: {
        label: 'Школьники',
        shortLabel: 'Шк',
        days: 'пн / ср',
        time: '16:00 – 18:00',
        color: 'text-sky-400',
        bgColor: 'bg-sky-400/10',
        borderColor: 'border-sky-400/30',
    },
} as const

export type TrainingGroup = keyof typeof TRAINING_GROUPS