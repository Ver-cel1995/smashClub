'use client'

import { useState } from 'react'
import Image from 'next/image'
import { GalleryLightbox } from './gallery-lightbox'
import type { GalleryItem } from '@/app/(main)/feed/gallery-queries'

type Props = {
    items: GalleryItem[]
}

export function GalleryGrid({ items }: Props) {
    const [activeIdx, setActiveIdx] = useState<number | null>(null)

    return (
        <>
            <div className="grid grid-cols-3 gap-1">
                {items.map((item, i) => (
                    <button
                        key={`${item.postId}-${i}`}
                        onClick={() => setActiveIdx(i)}
                        className="relative aspect-square overflow-hidden rounded-md bg-muted transition active:scale-95"
                    >
                        <Image
                            src={item.url}
                            alt={item.postTitle ?? ''}
                            fill
                            sizes="(max-width: 640px) 33vw, 200px"
                            className="object-cover"
                        />
                    </button>
                ))}
            </div>

            {activeIdx !== null && (
                <GalleryLightbox
                    items={items}
                    startIndex={activeIdx}
                    onClose={() => setActiveIdx(null)}
                />
            )}
        </>
    )
}