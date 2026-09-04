import laughAnimation from '@/assets/emojis/laugh.json'
import roflAnimation from '@/assets/emojis/rofl.json'
import easyAnimation from '@/assets/emojis/easy.json'
import poopAnimation from '@/assets/emojis/poop.json'

export type EmojiEntry = {
    id: string
    animationData: object
    label: string
}

export const EMOJI_REGISTRY: Record<string, EmojiEntry> = {
    fire: {
        id: 'poop',
        animationData: poopAnimation,
        label: '💩',
    },
    heart: {
        id: 'easy',
        animationData: easyAnimation,
        label: '👀',
    },
    rofl: {
        id: 'rofl',
        animationData: roflAnimation,
        label: '🤣',
    },
    laugh: {
        id: 'laugh',
        animationData: laughAnimation,
        label: '😀',
    },
}

export type EmojiId = keyof typeof EMOJI_REGISTRY

export const AVAILABLE_EMOJI_IDS: EmojiId[] = Object.keys(EMOJI_REGISTRY)

export function getEmoji(id: string): EmojiEntry | null {
    return EMOJI_REGISTRY[id] ?? null
}