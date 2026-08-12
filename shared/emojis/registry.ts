/**
 * Реестр всех доступных анимированных эмодзи.
 *
 * id — уникальный ключ, который хранится в БД (post_reactions.emoji).
 * animationData — Lottie JSON, который проигрывается в UI.
 * label — для accessibility (aria-label).
 */
type EmojiEntry = {
    id: string
    animationData: object
    label: string
}

export const EMOJI_REGISTRY: Record<string, EmojiEntry> = {
    // fire: {
    //     id: 'fire',
    //     animationData: fireAnimation,
    //     label: 'Огонь',
    // },
}

export type EmojiId = string

export const AVAILABLE_EMOJI_IDS: EmojiId[] = Object.keys(EMOJI_REGISTRY)

export function getEmoji(id: string): EmojiEntry | null {
    return EMOJI_REGISTRY[id] ?? null
}