export const TRAINING_GROUPS = {
    main: {
        label: 'Основная',
        shortLabel: 'Осн',
        days: 'вт / чт / сб',
        time: '18:00 – 20:00',
        color: 'text-lime-400',
        bgColor: 'bg-lime-400/10',
        borderColor: 'border-lime-400/30',
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