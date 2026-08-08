'use client'

import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { ImagePlus, X, GripVertical, FileText, File as FileIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { toast } from 'sonner'

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
}

interface PhotoUploadProps {
    disabled?: boolean
}

export const PhotoUpload = forwardRef<PhotoUploadHandle, PhotoUploadProps>(
    function PhotoUpload({ disabled }, ref) {
        const [previews, setPreviews] = useState<FilePreview[]>([])
        const inputRef = useRef<HTMLInputElement>(null)
        const [dragIndex, setDragIndex] = useState<number | null>(null)
        const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

        useImperativeHandle(ref, () => ({
            getFiles: () => previews.map((p) => p.file),
        }))

        const handleFiles = (files: FileList | null) => {
            if (!files) return

            const newFiles = Array.from(files)
            const totalAfter = previews.length + newFiles.length

            if (totalAfter > MAX_FILES) {
                toast.error(`Максимум ${MAX_FILES} файлов`)
                return
            }

            const valid: FilePreview[] = []

            for (const file of newFiles) {
                if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                    toast.error(`${file.name} слишком большой (макс ${MAX_SIZE_MB}MB)`)
                    continue
                }
                if (!ACCEPTED_TYPES[file.type]) {
                    toast.error(`${file.name} — неподдерживаемый формат`)
                    continue
                }
                valid.push({
                    file,
                    url: isImage(file.type) ? URL.createObjectURL(file) : '',
                    isImage: isImage(file.type),
                })
            }

            setPreviews((prev) => [...prev, ...valid])
        }

        const removeFile = (index: number) => {
            setPreviews((prev) => {
                const removed = prev[index]
                if (removed.url) URL.revokeObjectURL(removed.url)
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
                    disabled={disabled}
                />

                {/* Фото-превью (сетка) */}
                {imageCount > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                        {previews
                            .map((p, i) => ({ ...p, originalIndex: i }))
                            .filter((p) => p.isImage)
                            .map((p) => (
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
                                        'relative aspect-square rounded-xl overflow-hidden border-2 transition-all group',
                                        dragOverIndex === p.originalIndex
                                            ? 'border-lime-400 scale-105'
                                            : 'border-neutral-800',
                                        dragIndex === p.originalIndex && 'opacity-50'
                                    )}
                                >
                                    <img
                                        src={p.url}
                                        alt={p.file.name}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <GripVertical className="h-4 w-4 text-white drop-shadow" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(p.originalIndex)}
                                        disabled={disabled}
                                        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                    {p.originalIndex === previews.findIndex((pr) => pr.isImage) && (
                                        <div className="absolute bottom-1 left-1 rounded bg-lime-400 px-1.5 py-0.5 text-[9px] font-bold text-neutral-950">
                                            Обложка
                                        </div>
                                    )}
                                </div>
                            ))}
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
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{p.file.name}</p>
                                        <p className="text-xs text-neutral-500">
                                            {ACCEPTED_TYPES[p.file.type] || 'Файл'} · {formatFileSize(p.file.size)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(p.originalIndex)}
                                        disabled={disabled}
                                        className="rounded-lg p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                    </div>
                )}

                {/* Кнопка добавить */}
                {previews.length < MAX_FILES && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={disabled}
                        className={cn(
                            'flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-700 p-4 text-sm text-neutral-400',
                            'hover:border-neutral-600 hover:text-neutral-300 transition-colors',
                            'disabled:opacity-40 disabled:pointer-events-none'
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