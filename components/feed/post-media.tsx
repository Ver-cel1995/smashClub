'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, Download } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface PostMediaProps {
    urls: string[]
}

function isImageUrl(url: string): boolean {
    const lower = url.toLowerCase()
    return (
        lower.includes('.jpg') ||
        lower.includes('.jpeg') ||
        lower.includes('.png') ||
        lower.includes('.webp')
    )
}

function isDocUrl(url: string): boolean {
    return !isImageUrl(url)
}

function getDocInfo(url: string): { icon: string; label: string } {
    const lower = url.toLowerCase()
    if (lower.includes('.pdf')) return { icon: '📄', label: 'PDF документ' }
    if (lower.includes('.doc')) return { icon: '📝', label: 'Word документ' }
    if (lower.includes('.txt')) return { icon: '📃', label: 'Текстовый файл' }
    if (lower.includes('.rtf')) return { icon: '📃', label: 'RTF документ' }
    return { icon: '📎', label: 'Файл' }
}

function getFileName(url: string): string {
    try {
        const parts = url.split('/')
        const name = parts[parts.length - 1]
        // Убираем uuid-префикс: "uuid-originalname.ext" → "originalname.ext"
        const dashIndex = name.indexOf('-')
        if (dashIndex > 10) return decodeURIComponent(name.slice(dashIndex + 1))
        return decodeURIComponent(name)
    } catch {
        return 'Документ'
    }
}

export function PostMedia({ urls }: PostMediaProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

    if (urls.length === 0) return null

    const images = urls.filter(isImageUrl)
    const docs = urls.filter(isDocUrl)

    return (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            {/* Фото-галерея */}
            {images.length > 0 && (
                <div
                    className={cn(
                        'rounded-xl overflow-hidden',
                        images.length === 1 && 'grid grid-cols-1',
                        images.length === 2 && 'grid grid-cols-2 gap-0.5',
                        images.length >= 3 && 'grid grid-cols-2 gap-0.5'
                    )}
                >
                    {images.slice(0, 4).map((url, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setLightboxIndex(index)}
                            className={cn(
                                'relative overflow-hidden bg-neutral-800',
                                images.length === 1 && 'aspect-video',
                                images.length === 2 && 'aspect-square',
                                images.length === 3 && index === 0 && 'row-span-2 aspect-auto h-full',
                                images.length === 3 && index > 0 && 'aspect-square',
                                images.length >= 4 && 'aspect-square'
                            )}
                        >
                            <img
                                src={url}
                                alt={`Фото ${index + 1}`}
                                className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                            />
                            {index === 3 && images.length > 4 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-2xl font-bold text-white">
                    +{images.length - 4}
                  </span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Документы */}
            {docs.map((url, index) => {
                const { icon, label } = getDocInfo(url)
                const name = getFileName(url)

                return (
                    <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3 hover:border-neutral-700 transition-colors"
                    >
                        <span className="text-2xl">{icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{name}</p>
                            <p className="text-xs text-neutral-500">{label}</p>
                        </div>
                        <Download className="h-4 w-4 text-neutral-500 shrink-0" />
                    </a>
                )
            })}

            {/* Лайтбокс */}
            {lightboxIndex !== null && (
                <Lightbox
                    urls={images}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </div>
    )
}

function Lightbox({
                      urls,
                      initialIndex,
                      onClose,
                  }: {
    urls: string[]
    initialIndex: number
    onClose: () => void
}) {
    const [index, setIndex] = useState(initialIndex)

    const prev = () => setIndex((i) => (i > 0 ? i - 1 : urls.length - 1))
    const next = () => setIndex((i) => (i < urls.length - 1 ? i + 1 : 0))

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={onClose}
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/80"
            >
                <X className="h-6 w-6" />
            </button>

            <div className="absolute top-4 left-4 z-50 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                {index + 1} / {urls.length}
            </div>

            {urls.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            prev()
                        }}
                        className="absolute left-2 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/80"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            next()
                        }}
                        className="absolute right-2 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/80"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </>
            )}

            <img
                src={urls[index]}
                alt={`Фото ${index + 1}`}
                className="max-h-[90vh] max-w-[95vw] object-contain"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    )
}