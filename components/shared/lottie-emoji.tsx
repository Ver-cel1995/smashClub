'use client'

import { memo, useRef } from 'react'
import { type LottieRefCurrentProps } from 'lottie-react'
import { cn } from '@/shared/lib/utils'
import { getEmoji, type EmojiId } from '@/shared/emojis/registry'
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import('lottie-react'), {
    ssr: false,
    loading: () => <span className="inline-block h-full w-full" />,
})

type Props = {
    /** ID эмодзи из реестра */
    emojiId: EmojiId | string
    size?: number
    autoplay?: boolean
    loop?: boolean
    playOnHover?: boolean
    /** Проиграть один раз при монтировании (полезно при клике) */
    playOnce?: boolean
    className?: string
}

export const LottieEmoji = memo(function LottieEmoji({
                                                         emojiId,
                                                         size = 32,
                                                         autoplay = true,
                                                         loop = true,
                                                         playOnHover = false,
                                                         playOnce = false,
                                                         className,
                                                     }: Props) {
    const ref = useRef<LottieRefCurrentProps>(null)
    const emoji = getEmoji(emojiId)

    if (!emoji) {
        // Фолбэк
        console.warn(`[LottieEmoji] Unknown emojiId: ${emojiId}`)
        return null
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