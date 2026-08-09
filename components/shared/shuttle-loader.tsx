'use client'

import { cn } from '@/shared/lib/utils'

interface ShuttleLoaderProps {
    fullScreen?: boolean
    size?: number | string
    className?: string
}

export function ShuttleLoader({
                                  fullScreen = false,
                                  size = 'min(70vw, 320px)',
                                  className,
                              }: ShuttleLoaderProps) {
    const cssSize = typeof size === 'number' ? `${size}px` : size

    return (
        <div
            className={cn(
                'grid place-items-center',
                fullScreen && 'fixed inset-0 z-[9999] min-h-dvh',
                className
            )}
            style={{
                background: fullScreen
                    ? 'radial-gradient(circle at 50% 42%, #141f0e 0%, #050604 58%, #000 100%)'
                    : undefined,
            }}
            role="status"
            aria-live="polite"
            aria-label="Загрузка"
        >
            <svg
                className="block h-auto overflow-visible"
                style={{
                    width: cssSize,
                    filter: 'drop-shadow(0 18px 36px rgba(0,0,0,.55))',
                }}
                viewBox="0 0 420 460"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <radialGradient id="blBg" cx="50%" cy="42%" r="64%">
                        <stop offset="0%" stopColor="#17250f" />
                        <stop offset="55%" stopColor="#060806" />
                        <stop offset="100%" stopColor="#000000" />
                    </radialGradient>

                    <linearGradient id="blGreenStroke" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#b7ff4a" />
                        <stop offset="48%" stopColor="#78c522" />
                        <stop offset="100%" stopColor="#3f8f10" />
                    </linearGradient>

                    <linearGradient id="blProgress" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#4b8d15" />
                        <stop offset="40%" stopColor="#b8ff4a" />
                        <stop offset="100%" stopColor="#78c522" />
                    </linearGradient>

                    <filter id="blGlow" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <filter id="blStrongGlow" x="-60%" y="-60%" width="220%" height="220%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <clipPath id="blBadgeClip">
                        <circle cx="210" cy="190" r="157" />
                    </clipPath>
                </defs>

                {/* Фон */}
                <circle cx="210" cy="190" r="176" fill="url(#blBg)" />
                <circle cx="210" cy="190" r="171" fill="none" stroke="#23351b" strokeWidth="14" opacity=".55" />

                {/* Эмблема */}
                <g className="bl-badge">
                    <circle cx="210" cy="190" r="157" fill="#050605" />
                    <circle cx="210" cy="190" r="157" fill="none" stroke="#ecffe5" strokeWidth="5" opacity=".9" />
                    <circle cx="210" cy="190" r="165" fill="none" stroke="url(#blGreenStroke)" strokeWidth="6" filter="url(#blGlow)" />

                    <g clipPath="url(#blBadgeClip)">
                        {/* Зелёные мазки */}
                        <g stroke="#78c522" strokeWidth="6" strokeLinecap="round" opacity=".9">
                            <path className="bl-scratch-1" d="M58 112 L130 74" />
                            <path className="bl-scratch-2" d="M54 132 L142 86" />
                            <path className="bl-scratch-3" d="M58 153 L139 112" />
                            <path className="bl-scratch-4" d="M72 174 L128 147" />
                        </g>

                        {/* Тёмные следы справа */}
                        <g stroke="#273122" strokeWidth="5" strokeLinecap="round" opacity=".7">
                            <path d="M282 62 C326 82 350 111 362 151" />
                            <path d="M280 85 C323 101 352 135 365 178" />
                            <path d="M274 110 C310 126 340 159 354 196" />
                        </g>

                        {/* Волан сверху */}
                        <g transform="translate(205 86) rotate(-10)" filter="url(#blGlow)">
                            <g fill="#fbfff5" stroke="#030403" strokeWidth="3">
                                <path d="M-42 -18 C-20 -68 5 -78 19 -68 C12 -40 -11 -12 -36 7 Z" />
                                <path d="M-14 -24 C8 -79 36 -87 50 -74 C43 -41 17 -9 -10 10 Z" />
                                <path d="M18 -22 C49 -70 79 -67 90 -50 C76 -21 48 4 18 15 Z" />
                                <path d="M48 -10 C82 -45 111 -34 116 -13 C96 9 73 24 43 26 Z" />
                                <path d="M75 6 C103 -15 126 -5 127 16 C106 31 88 37 66 34 Z" />
                            </g>
                            <g stroke="#78c522" strokeWidth="3" strokeLinecap="round">
                                <path d="M-30 1 L9 -63" />
                                <path d="M-3 5 L42 -70" />
                                <path d="M25 12 L83 -48" />
                                <path d="M51 22 L113 -15" />
                            </g>
                            <ellipse cx="-60" cy="25" rx="25" ry="31" transform="rotate(-40 -60 25)" fill="#fbfff5" stroke="#030403" strokeWidth="4" />
                            <path d="M-37 0 L-8 28 L-25 47 L-57 17 Z" fill="#050505" />
                        </g>

                        {/* Текст */}
                        <text x="210" y="177" textAnchor="middle" className="bl-main-text" fill="#fbfff5" stroke="#050505" strokeWidth="6" paintOrder="stroke">
                            БАДМИНТОН
                        </text>

                        <rect x="98" y="190" width="224" height="39" rx="8" fill="#0b0f08" stroke="#78c522" strokeWidth="2.5" opacity=".98" />
                        <text x="210" y="219" textAnchor="middle" className="bl-city-text" fill="#8ee02a">
                            КУЩЕВСКАЯ
                        </text>

                        <g transform="translate(210 250)">
                            <line x1="-130" y1="0" x2="-77" y2="0" stroke="#78c522" strokeWidth="4" strokeLinecap="round" />
                            <line x1="77" y1="0" x2="130" y2="0" stroke="#78c522" strokeWidth="4" strokeLinecap="round" />
                            <text x="0" y="5" textAnchor="middle" className="bl-slogan-text" fill="#fbfff5">
                                ТРЕНИРУЙСЯ • ИГРАЙ • ПОБЕЖДАЙ
                            </text>
                        </g>

                        {/* Ракетки */}
                        <g transform="translate(210 286)" fill="none" stroke="#fbfff5" strokeLinecap="round" opacity=".96">
                            <g className="bl-racket-left">
                                <line x1="-55" y1="43" x2="-10" y2="-4" strokeWidth="4" />
                                <ellipse cx="-24" cy="-23" rx="19" ry="28" transform="rotate(-33 -24 -23)" strokeWidth="3" />
                                <path d="M-38 -36 L-11 -15 M-46 -23 L-18 -2 M-30 -49 L-4 -28" strokeWidth="1.7" opacity=".85" />
                            </g>
                            <g className="bl-racket-right">
                                <line x1="55" y1="43" x2="10" y2="-4" strokeWidth="4" />
                                <ellipse cx="24" cy="-23" rx="19" ry="28" transform="rotate(33 24 -23)" strokeWidth="3" />
                                <path d="M38 -36 L11 -15 M46 -23 L18 -2 M30 -49 L4 -28" strokeWidth="1.7" opacity=".85" />
                            </g>
                            <polygon points="0,-14 5,-3 17,-2 8,6 10,18 0,12 -10,18 -8,6 -17,-2 -5,-3" fill="#78c522" stroke="none" />
                        </g>
                    </g>
                </g>

                {/* Вращающиеся кольца */}
                <g className="bl-spin-ring" filter="url(#blStrongGlow)">
                    <circle cx="210" cy="190" r="177" fill="none" stroke="url(#blGreenStroke)" strokeWidth="8" strokeLinecap="round" strokeDasharray="310 210" />
                </g>
                <g className="bl-counter-ring">
                    <circle cx="210" cy="190" r="187" fill="none" stroke="#fbfff5" strokeWidth="3" strokeLinecap="round" strokeDasharray="92 492" opacity=".95" />
                </g>

                {/* Волан на орбите */}
                <g className="bl-shuttle-orbit" filter="url(#blStrongGlow)">
                    <g className="bl-shuttle" transform="translate(210 8) rotate(40) scale(.5)">
                        <g fill="#fbfff5" stroke="#020402" strokeWidth="5">
                            <path d="M20 -16 C67 -67 132 -73 153 -59 C121 -27 70 0 22 13 Z" />
                            <path d="M17 -18 C55 -83 115 -94 138 -79 C114 -37 65 -6 20 12 Z" transform="rotate(-13)" />
                            <path d="M21 -11 C67 -56 124 -45 141 -28 C109 -7 67 14 23 16 Z" transform="rotate(14)" />
                        </g>
                        <g stroke="#78c522" strokeWidth="6" strokeLinecap="round">
                            <path d="M29 7 L134 -55" />
                            <path d="M29 7 L139 -27" />
                            <path d="M29 7 L122 -75" />
                        </g>
                        <ellipse cx="-17" cy="20" rx="29" ry="35" transform="rotate(-42 -17 20)" fill="#fbfff5" stroke="#020402" strokeWidth="6" />
                        <path d="M9 -15 L40 15 L21 38 L-12 5 Z" fill="#050505" />
                    </g>
                </g>

                {/* Loading блок */}
                <g transform="translate(210 410)">
                    <text x="0" y="-32" textAnchor="middle" className="bl-loading-text" fill="#fbfff5">
                        ЗАГРУЗКА
                    </text>
                    <circle className="bl-dot-1" cx="61" cy="-36" r="3" fill="#8ee02a" />
                    <circle className="bl-dot-2" cx="73" cy="-36" r="3" fill="#8ee02a" />
                    <circle className="bl-dot-3" cx="85" cy="-36" r="3" fill="#8ee02a" />

                    <rect x="-120" y="-12" width="240" height="14" rx="7" fill="#151a12" stroke="#405331" strokeWidth="1.5" />
                    <rect className="bl-progress-fill" x="-116" y="-8" width="232" height="6" rx="3" fill="url(#blProgress)" filter="url(#blGlow)" />
                    <rect className="bl-progress-shine" x="-22" y="-10" width="44" height="10" rx="5" fill="#ffffff" opacity=".42" />
                </g>
            </svg>
        </div>
    )
}