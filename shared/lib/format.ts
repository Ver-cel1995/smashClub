import { formatDistanceToNow, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'


/**
 * "2 часа назад", "5 минут назад"
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    return formatDistanceToNow(d, { addSuffix: true, locale: ru })
}

/**
 * "15 января, 18:00"
 */
export function formatDateTime(date: string | Date): string {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, 'd MMMM, HH:mm', { locale: ru })
}


/**
 * Проверяет, нужно ли обрезать текст для превью.
 * Учитывает и длину, и количество переносов строк.
 */
export function shouldTruncate(text: string, maxLines = 4, maxChars = 280): boolean {
    const lines = text.split('\n').length
    return text.length > maxChars || lines > maxLines
}

/**
 * Правильное склонение "N комментариев"
 */
export function pluralize(count: number, forms: [string, string, string]): string {
    const n = Math.abs(count) % 100
    const n1 = n % 10
    if (n > 10 && n < 20) return forms[2]
    if (n1 > 1 && n1 < 5) return forms[1]
    if (n1 === 1) return forms[0]
    return forms[2]
}

// Хелперы для частых случаев
export const commentWord = (n: number) => pluralize(n, ['комментарий', 'комментария', 'комментариев'])
export const reactionWord = (n: number) => pluralize(n, ['реакция', 'реакции', 'реакций'])
export const peopleWord = (n: number) => pluralize(n, ['человек', 'человека', 'человек'])
export const voteWord = (n: number) => pluralize(n, ['голос', 'голоса', 'голосов'])

















export function formatDayMonth(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'd MMMM', { locale: ru })
}

/** "понедельник, 15 января" */
export function formatFullDate(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'EEEE, d MMMM', { locale: ru })
}

/** Сегодня / Завтра / Вчера / 15 января */
export function formatSmartDate(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (isToday(d)) return 'Сегодня'
    if (isTomorrow(d)) return 'Завтра'
    if (isYesterday(d)) return 'Вчера'
    return formatDayMonth(d)
}

/** День недели: "пн", "вт" */
export function formatWeekdayShort(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'EEEEEE', { locale: ru })
}

/** Число: "15" */
export function formatDayNumber(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'd')
}

/** Время: "18:00 – 20:00" */
export function formatTimeRange(start: string, end: string): string {
    return `${start.slice(0, 5)} – ${end.slice(0, 5)}`
}