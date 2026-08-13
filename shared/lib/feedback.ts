import type { FeedbackType, FeedbackStatus } from '@/app/(main)/profile/feedback/actions'

export const FEEDBACK_TYPE_META: Record<FeedbackType, {
    icon: string
    label: string
    color: string
    bgColor: string
}> = {
    bug: {
        icon: '🐛',
        label: 'Баг',
        color: 'text-danger',
        bgColor: 'bg-danger-muted',
    },
    idea: {
        icon: '💡',
        label: 'Идея',
        color: 'text-warning',
        bgColor: 'bg-warning-muted',
    },
    other: {
        icon: '💬',
        label: 'Другое',
        color: 'text-info',
        bgColor: 'bg-info-muted',
    },
}

export const FEEDBACK_STATUS_META: Record<FeedbackStatus, {
    icon: string
    label: string
    color: string
    bgColor: string
}> = {
    new: {
        icon: '🆕',
        label: 'Новое',
        color: 'text-info',
        bgColor: 'bg-info-muted',
    },
    seen: {
        icon: '👀',
        label: 'Просмотрено',
        color: 'text-muted',
        bgColor: 'bg-subtle',
    },
    in_progress: {
        icon: '⚙️',
        label: 'В работе',
        color: 'text-accent',
        bgColor: 'bg-accent-muted',
    },
    done: {
        icon: '✅',
        label: 'Готово',
        color: 'text-success',
        bgColor: 'bg-success-muted',
    },
    rejected: {
        icon: '❌',
        label: 'Отклонено',
        color: 'text-danger',
        bgColor: 'bg-danger-muted',
    },
}