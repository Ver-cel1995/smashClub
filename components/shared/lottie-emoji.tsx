'use client'

import { memo, useEffect, useRef, useState } from 'react'
import type { LottieRefCurrentProps } from 'lottie-react'
import { cn } from '@/shared/lib/utils'
import { getEmoji, type EmojiId } from '@/shared/emojis/registry'
import dynamic from 'next/dynamic'

const Lottie = dynamic(() => import('lottie-react'), {
    ssr: false,
    loading: () => <span className="inline-block h-full w-full rounded-full bg-subtle/50 animate-pulse" />,
})

const animationCache = new Map<string, object>()

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
    const [animationData, setAnimationData] = useState<object | null>(
        emoji ? animationCache.get(emoji.src) ?? null : null
    )

    useEffect(() => {
        if (!emoji || animationData) return

        let cancelled = false
        fetch(emoji.src)
            .then((r) => r.json())
            .then((json: object) => {
                animationCache.set(emoji.src, json)
                if (!cancelled) setAnimationData(json)
            })
            .catch(() => {})

        return () => {
            cancelled = true
        }
    }, [emoji, animationData])

    if (!emoji || !animationData) {
        return (
            <span
                className={cn('inline-flex shrink-0 select-none items-center justify-center', className)}
                style={{ width: size, height: size, fontSize: size * 0.7 }}
            >
                {emoji?.fallback ?? '👍'}
            </span>
        )
    }

    const play = () => ref.current?.goToAndPlay(0, true)

    return (
        <div
            className={cn('inline-block shrink-0', className)}
            style={{ width: size, height: size }}
            onMouseEnter={playOnHover ? play : undefined}
            aria-label={emoji.label}
        >
            <Lottie
                lottieRef={ref}
                animationData={animationData}
                loop={playOnce ? false : loop}
                autoplay={autoplay && !playOnHover}
            />
        </div>
    )
})