'use client'

import { memo, useRef } from 'react'
import type { LottieRefCurrentProps } from 'lottie-react'
import { cn } from '@/shared/lib/utils'
import { getEmoji, type EmojiId } from '@/shared/emojis/registry'
import dynamic from 'next/dynamic'

const Lottie = dynamic(() => import('lottie-react'), {
    ssr: false,
    loading: () => <span className="inline-block h-full w-full bg-subtle/50 rounded-full animate-pulse" />,
})

const EMOJI_FALLBACKS: Record<string, string> = {
    poop: '💩',
    easy: '👀',
    rofl: '🤣',
    laugh: '😂',
}

type Props = {
    emojiId: EmojiId | string
    size?: number
    autoplay?: boolean
    loop?: boolean
    playOnHover?: boolean
    playOnce?: boolean
    className?: string
}

export const LottieEmoji = memo(function LottieEmoji({
                                                         emojiId,
                                                         size = 28,
                                                         autoplay = true,
                                                         loop = true,
                                                         playOnHover = false,
                                                         playOnce = false,
                                                         className,
                                                     }: Props) {
    const ref = useRef<LottieRefCurrentProps>(null)
    const emoji = getEmoji(emojiId)

    if (!emoji || !emoji.animationData) {
        // Текстовый фоллбек, если Lottie JSON ещё не добавлен
        const symbol = EMOJI_FALLBACKS[emojiId] || '👍'
        return (
            <span
                className={cn('inline-flex items-center justify-center shrink-0 select-none', className)}
                style={{ width: size, height: size, fontSize: size * 0.7 }}
            >
                {symbol}
            </span>
        )
    }

    const play = () => {
        ref.current?.goToAndPlay(0, true)
    }

    const shouldAutoplay = autoplay && !playOnHover

    return (
        <div
            className={cn('inline-block shrink-0', className)}
            style={{ width: size, height: size }}
            onMouseEnter={playOnHover ? play : undefined}
            aria-label={emoji.label}
        >
            <Lottie
                lottieRef={ref}
                animationData={emoji.animationData}
                loop={playOnce ? false : loop}
                autoplay={shouldAutoplay}
            />
        </div>
    )
})