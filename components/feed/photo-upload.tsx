'use client'

import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import { ImagePlus, X, GripVertical, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { toast } from 'sonner'
import { compressImage } from '@/shared/lib/image-compress'

const MAX_FILES = 10
const MAX_SIZE_MB = 20

const ACCEPTED_TYPES: Record<string, string> = {
    'image/jpeg': 'Фото',
    'image/png': 'Фото',
    'image/webp': 'Фото',
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'text/plain': 'Текст',
    'application/rtf': 'RTF',
}

const ACCEPT_STRING = Object.keys(ACCEPTED_TYPES).join(',')

function isImage(type: string) {
    return type.startsWith('image/')
}

function getFileIcon(type: string) {
    if (type === 'application/pdf') return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type === 'text/plain' || type === 'application/rtf') return '📃'
    return '📎'
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface PhotoUploadHandle {
    getFiles: () => File[]
}

interface FilePreview {
    file: File
    url: string
    isImage: boolean
    /** Экономия от сжатия в процентах (только для фото) */
    savedPercent?: number
}

interface PhotoUploadProps {
    disabled?: boolean
}

export const PhotoUpload = forwardRef<PhotoUploadHandle, PhotoUploadProps>(
    function PhotoUpload({ disabled }, ref) {
        const [previews, setPreviews] = useState<FilePreview[]>([])
        const [compressing, setCompressing] = useState(0) // счётчик файлов в обработке
        const inputRef = useRef<HTMLInputElement>(null)
        const [dragIndex, setDragIndex] = useState<number | null>(null)
        const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

        useImperativeHandle(ref, () => ({
            getFiles: () => previews.map((p) => p.file),
        }))

        // Очистка Blob URL при размонтировании
        useEffect(() => {
            return () => {
                previews.forEach((p) => {
                    if (p.url) URL.revokeObjectURL(p.url)
                })
            }
        }, [previews])

        const handleFiles = async (files: FileList | null) => {
            if (!files) return

            const incoming = Array.from(files)
            const totalAfter = previews.length + incoming.length

            if (totalAfter > MAX_FILES) {
                toast.error(`Максимум ${MAX_FILES} файлов`)
                return
            }

            // Предварительная валидация (размер + тип)
            const filtered: File[] = []
            for (const file of incoming) {
                if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                    toast.error(`${file.name} слишком большой (макс ${MAX_SIZE_MB}MB)`)
                    continue
                }
                if (!ACCEPTED_TYPES[file.type]) {
                    toast.error(`${file.name} — неподдерживаемый формат`)
                    continue
                }
                filtered.push(file)
            }

            if (filtered.length === 0) return

            setCompressing((n) => n + filtered.length)

            // Сжимаем параллельно, но каждый добавляем в state как только готов —
            // так пользователь видит превью по мере обработки
            await Promise.all(
                filtered.map(async (file) => {
                    try {
                        const finalFile = isImage(file.type)
                            ? await compressImage(file, {
                                maxSizeMB: 0.8,
                                maxWidthOrHeight: 1920,
                                useWebp: true,
                            })
                            : file

                        const savedPercent = isImage(file.type) && finalFile.size < file.size
                            ? Math.round((1 - finalFile.size / file.size) * 100)
                            : 0

                        const preview: FilePreview = {
                            file: finalFile,
                            url: isImage(finalFile.type) ? URL.createObjectURL(finalFile) : '',
                            isImage: isImage(finalFile.type),
                            savedPercent: savedPercent > 0 ? savedPercent : undefined,
                        }

                        setPreviews((prev) => [...prev, preview])
                    } catch (e) {
                        console.error('[photo-upload] compress failed:', e)
                        toast.error(`${file.name} — не удалось обработать`)
                    } finally {
                        setCompressing((n) => Math.max(0, n - 1))
                    }
                })
            )
        }

        const removeFile = (index: number) => {
            setPreviews((prev) => {
                const removed = prev[index]
                if (removed?.url) URL.revokeObjectURL(removed.url)
                return prev.filter((_, i) => i !== index)
            })
        }

        const handleDragStart = (index: number) => setDragIndex(index)

        const handleDragOver = (e: React.DragEvent, index: number) => {
            e.preventDefault()
            setDragOverIndex(index)
        }

        const handleDrop = (index: number) => {
            if (dragIndex === null || dragIndex === index) {
                setDragIndex(null)
                setDragOverIndex(null)
                return
            }

            setPreviews((prev) => {
                const arr = [...prev]
                const [moved] = arr.splice(dragIndex, 1)
                arr.splice(index, 0, moved)
                return arr
            })

            setDragIndex(null)
            setDragOverIndex(null)
        }

        const imageCount = previews.filter((p) => p.isImage).length
        const docCount = previews.filter((p) => !p.isImage).length
        const isBusy = compressing > 0

        return (
            <div className="space-y-3">
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT_STRING}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                        handleFiles(e.target.files)
                        e.target.value = ''
                    }}
                    disabled={disabled || isBusy}
                />

                {/* Фото-превью (сетка) */}
                {imageCount > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                        {previews
                            .map((p, i) => ({ ...p, originalIndex: i }))
                            .filter((p) => p.isImage)
                            .map((p) => {
                                const isCover =
                                    p.originalIndex ===
                                    previews.findIndex((pr) => pr.isImage)

                                return (
                                    <div
                                        key={p.originalIndex}
                                        draggable={!disabled}
                                        onDragStart={() => handleDragStart(p.originalIndex)}
                                        onDragOver={(e) => handleDragOver(e, p.originalIndex)}
                                        onDrop={() => handleDrop(p.originalIndex)}
                                        onDragEnd={() => {
                                            setDragIndex(null)
                                            setDragOverIndex(null)
                                        }}
                                        className={cn(
                                            'group relative aspect-square overflow-hidden rounded-xl border-2 transition-all',
                                            dragOverIndex === p.originalIndex
                                                ? 'scale-105 border-lime-400'
                                                : 'border-neutral-800',
                                            dragIndex === p.originalIndex && 'opacity-50'
                                        )}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={p.url}
                                            alt={p.file.name}
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
                                        <div className="absolute left-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                                            <GripVertical className="h-4 w-4 text-white drop-shadow" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(p.originalIndex)}
                                            disabled={disabled}
                                            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-colors hover:bg-red-500 group-hover:opacity-100"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>

                                        {isCover && (
                                            <div className="absolute bottom-1 left-1 rounded bg-lime-400 px-1.5 py-0.5 text-[9px] font-bold text-neutral-950">
                                                Обложка
                                            </div>
                                        )}

                                        {p.savedPercent && (
                                            <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-lime-400">
                                                −{p.savedPercent}%
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                    </div>
                )}

                {/* Документы (список) */}
                {docCount > 0 && (
                    <div className="space-y-2">
                        {previews
                            .map((p, i) => ({ ...p, originalIndex: i }))
                            .filter((p) => !p.isImage)
                            .map((p) => (
                                <div
                                    key={p.originalIndex}
                                    className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3"
                                >
                                    <span className="text-2xl">{getFileIcon(p.file.type)}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-white">{p.file.name}</p>
                                        <p className="text-xs text-neutral-500">
                                            {ACCEPTED_TYPES[p.file.type] || 'Файл'} ·{' '}
                                            {formatFileSize(p.file.size)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(p.originalIndex)}
                                        disabled={disabled}
                                        className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                    </div>
                )}

                {/* Индикатор сжатия */}
                {isBusy && (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-neutral-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-lime-400" />
                        Обрабатываем {compressing}{' '}
                        {compressing === 1 ? 'файл' : compressing < 5 ? 'файла' : 'файлов'}...
                    </div>
                )}

                {/* Кнопка добавить */}
                {previews.length < MAX_FILES && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={disabled || isBusy}
                        className={cn(
                            'flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-700 p-4 text-sm text-neutral-400',
                            'transition-colors hover:border-neutral-600 hover:text-neutral-300',
                            'disabled:pointer-events-none disabled:opacity-40'
                        )}
                    >
                        <ImagePlus className="h-5 w-5" />
                        <span>
                            {previews.length === 0
                                ? 'Добавить фото или документ'
                                : `Добавить ещё (${previews.length}/${MAX_FILES})`}
                        </span>
                    </button>
                )}
            </div>
        )
    }
)