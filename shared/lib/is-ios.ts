/**
 * Проверяет, запущен ли веб-клиент на мобильной ОС iOS (iPhone/iPad/iPod).
 * Используется для включения специального режима производительности GPU (без heavy backdrop-blur).
 */
export function isIOS(): boolean {
    if (typeof window === 'undefined') return false
    return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document)
    )
}
