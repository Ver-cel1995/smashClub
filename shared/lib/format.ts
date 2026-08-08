import { formatDistanceToNow, format } from 'date-fns'
import { ru } from 'date-fns/locale'

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