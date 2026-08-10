import fireAnimation from '@/assets/emojis/fire.json'
// Добавляй новые здесь:
// import heartAnimation from '@/assets/emojis/heart.json'
// import clapAnimation from '@/assets/emojis/clap.json'

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
        animationData: fireAnimation,
        label: 'Огонь',
    },
    // heart: {
    //     id: 'heart',
    //     animationData: heartAnimation,
    //     label: 'Сердце',
    // },
} as const

export type EmojiId = keyof typeof EMOJI_REGISTRY

/** Список id в порядке отображения */
export const AVAILABLE_EMOJI_IDS = Object.keys(EMOJI_REGISTRY) as EmojiId[]

export function getEmoji(id: string) {
    return EMOJI_REGISTRY[id as EmojiId] ?? null
}