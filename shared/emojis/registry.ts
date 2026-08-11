/**
 * Реестр всех доступных анимированных эмодзи.
 *
 * id — уникальный ключ, который хранится в БД (post_reactions.emoji).
 * animationData — Lottie JSON, который проигрывается в UI.
 * label — для accessibility (aria-label).
 *
 * ⚠️ Меняя id уже существующего эмодзи — сломаешь старые реакции в БД.
 * Добавляй новые id, но не переименовывай существующие.
 */
export const EMOJI_REGISTRY = {
    fire: {
        id: 'fire',
        animationData: "авыа",
        label: 'Огонь',
    },
} as const

export type EmojiId = keyof typeof EMOJI_REGISTRY

export const AVAILABLE_EMOJI_IDS = Object.keys(EMOJI_REGISTRY) as EmojiId[]

export function getEmoji(id: string) {
    return EMOJI_REGISTRY[id as EmojiId] ?? null
}