'use client'

import {useEffect, useState} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {Calendar} from 'lucide-react'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {GalleryLightbox} from './gallery-lightbox'
import {fetchGalleryGroupsAction} from '@/app/(main)/feed/actions'
import {formatDayMonth} from '@/shared/lib/format'
import {cn} from '@/shared/lib/utils'
import type {GalleryPostGroup} from '@/app/(main)/feed/gallery-queries'
import {useProgressAction} from "@/shared/hooks/use-progress-action";

const MONTHS = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const MONTHS_SHORT = [
    'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
    'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
]

type Props = {
    initialMonths: string[] // не используем, оставлен для совместимости
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function GalleryTab(_props: Props) {
    const [groups, setGroups] = useState<GalleryPostGroup[]>([])
    const [month, setMonth] = useState<number | null>(null) // null = все
    const [isPending, startTransition] = useProgressAction()

    // Lightbox
    const [lightbox, setLightbox] = useState<{
        images: { url: string; postId: string; postTitle: string | null; createdAt: string }[]
        startIndex: number
    } | null>(null)

    useEffect(() => {
        startTransition(async () => {
            const data = await fetchGalleryGroupsAction({
                month: month ?? undefined,
            })
            setGroups(data)
        })
    }, [month])

    const openLightbox = (group: GalleryPostGroup, imageIdx: number) => {
        setLightbox({
            images: group.images.map((url) => ({
                url,
                postId: group.postId,
                postTitle: group.postTitle,
                createdAt: group.createdAt,
            })),
            startIndex: imageIdx,
        })
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Фильтр по месяцу */}
            <div className="flex items-center justify-end">
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            className={cn(
                                'flex items-center gap-1.5 rounded-xl border border-neutral-700 px-3 py-2 text-xs font-medium transition',
                                month !== null
                                    ? 'border-lime-400/40 bg-lime-400/10 text-lime-400'
                                    : 'text-neutral-300 hover:bg-neutral-800/60'
                            )}
                        >
                            <Calendar className="h-4 w-4" />
                            {month !== null ? MONTHS_SHORT[month - 1] : 'Все месяцы'}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-64 p-3">
                        <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Выбери месяц
              </span>
                            {month !== null && (
                                <button
                                    onClick={() => setMonth(null)}
                                    className="text-xs text-lime-400 hover:underline"
                                >
                                    Сбросить
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {MONTHS.map((name, i) => {
                                const value = i + 1
                                const active = month === value
                                return (
                                    <button
                                        key={value}
                                        onClick={() => setMonth(value)}
                                        className={cn(
                                            'rounded-lg px-2 py-2 text-xs font-medium transition',
                                            active
                                                ? 'bg-lime-400 text-neutral-950'
                                                : 'bg-neutral-800/60 text-neutral-200 hover:bg-neutral-800'
                                        )}
                                    >
                                        {MONTHS_SHORT[i]}
                                    </button>
                                )
                            })}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Контент */}
            {isPending ? (
                <div className="flex justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-400 border-t-transparent" />
                </div>
            ) : groups.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                    <span className="text-3xl">📷</span>
                    <p className="text-sm text-muted-foreground">
                        Фото {month !== null ? 'за этот месяц' : ''} не найдены
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {groups.map((group) => (
                        <section key={group.postId}>
                            <Link
                                href={`/feed/${group.postId}`}
                                className="mb-2 flex items-baseline justify-between gap-2 px-1"
                            >
                                <h3 className="line-clamp-1 text-sm font-semibold text-neutral-100 hover:text-lime-400">
                                    {group.postTitle ?? 'Без заголовка'}
                                </h3>
                                <span className="shrink-0 text-[11px] text-neutral-500">
                  {formatDayMonth(group.createdAt)}
                </span>
                            </Link>

                            <div className="grid grid-cols-3 gap-1">
                                {group.images.map((url, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => openLightbox(group, idx)}
                                        className="relative aspect-square overflow-hidden rounded-md bg-neutral-800 transition active:scale-95"
                                    >
                                        <Image
                                            src={url}
                                            alt={group.postTitle ?? ''}
                                            fill
                                            sizes="(max-width: 640px) 33vw, 200px"
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {lightbox && (
                <GalleryLightbox
                    items={lightbox.images}
                    startIndex={lightbox.startIndex}
                    onClose={() => setLightbox(null)}
                />
            )}
        </div>
    )
}