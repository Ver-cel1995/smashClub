/**
 * Получает инициалы из полного имени.
 * "Дмитрий Иванов" → "ДИ"
 * "Даша" → "Д"
 */
export function getInitials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Короткое имя: "Дмитрий Иванов" → "Дмитрий И."
 */
export function getShortName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 1) return parts[0]
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}

/**
 * Первое имя: "Дмитрий Иванов" → "Дмитрий"
 */
export function getFirstName(fullName: string): string {
    return fullName.trim().split(/\s+/)[0]
}