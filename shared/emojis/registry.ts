export type EmojiEntry = {
    id: string
    src: string
    label: string
    fallback: string
}

export const EMOJI_REGISTRY: Record<string, EmojiEntry> = {
    fire: { id: 'poop', src: '/emojis/poop.json', label: '💩', fallback: '💩' },
    heart: { id: 'easy', src: '/emojis/easy.json', label: '👀', fallback: '👀' },
    rofl: { id: 'rofl', src: '/emojis/rofl.json', label: '🤣', fallback: '🤣' },
    laugh: { id: 'laugh', src: '/emojis/laugh.json', label: '😀', fallback: '😂' },
}

export type EmojiId = keyof typeof EMOJI_REGISTRY

export const AVAILABLE_EMOJI_IDS: EmojiId[] = Object.keys(EMOJI_REGISTRY)

export function getEmoji(id: string): EmojiEntry | null {
    return EMOJI_REGISTRY[id] ?? null
}