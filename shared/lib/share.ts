import type { Training } from '@/types'

/**
 * Формирует данные для шаринга тренировки.
 */
export function buildTrainingShareData(
    training: Pick<Training, 'id' | 'date' | 'start_time' | 'end_time' | 'status' | 'status_note'>,
    baseUrl: string  // например window.location.origin
): {
    title: string
    text: string
    url: string
} {
    const dateStr = new Date(training.date).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        weekday: 'long',
    })

    const startTime = training.start_time.slice(0, 5)
    const endTime = training.end_time.slice(0, 5)

    let statusPrefix = '🏸'
    if (training.status === 'cancelled') statusPrefix = '❌'
    else if (training.status === 'holiday') statusPrefix = '🎉'
    else if (training.status === 'tournament_trip') statusPrefix = '🏆'
    else if (training.status === 'substitute') statusPrefix = '👤'
    else if (training.status === 'no_coach_open') statusPrefix = '🔓'

    const title = `${statusPrefix} Тренировка ${dateStr}`
    const text = training.status_note
        ? `${startTime}–${endTime}\n${training.status_note}`
        : `${startTime}–${endTime}`

    const url = `${baseUrl}/schedule/${training.id}`

    return { title, text, url }
}