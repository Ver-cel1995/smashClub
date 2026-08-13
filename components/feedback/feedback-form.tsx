'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2, X, Image as ImageIcon, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import { compressImage } from '@/shared/lib/image-compress'
import { sendFeedback, uploadFeedbackScreenshot, type FeedbackType } from '@/app/(main)/profile/feedback/actions'
import { FEEDBACK_TYPE_META } from '@/shared/lib/feedback'

const TYPES: FeedbackType[] = ['bug', 'idea', 'other']

export function FeedbackForm() {
    const [type, setType] = useState<FeedbackType>('bug')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [screenshot, setScreenshot] = useState<{ url: string; path: string } | null>(null)
    const [uploadingScreenshot, setUploadingScreenshot] = useState(false)
    const [runAction, isPending] = useProgressAction()
    const [errors, setErrors] = useState<Record<string, string>>({})

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return

        setUploadingScreenshot(true)
        try {
            const compressed = await compressImage(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebp: true,
            })

            const fd = new FormData()
            fd.append('screenshot', compressed)

            const result = await uploadFeedbackScreenshot(fd)
            if (result.success && result.data) {
                setScreenshot(result.data)
                toast.success('Скриншот загружен')
            } else {
                if (!(result.success)) {
                    toast.error(result.error || 'Ошибка загрузки')
                }
            }
        } catch (e) {
            console.error(e)
            toast.error('Не удалось обработать файл')
        } finally {
            setUploadingScreenshot(false)
        }
    }

    const removeScreenshot = () => {
        setScreenshot(null)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

        runAction(async () => {
            const result = await sendFeedback({
                type,
                title: title.trim(),
                description: description.trim(),
                screenshot_url: screenshot?.url ?? null,
                screenshot_storage_path: screenshot?.path ?? null,
            })

            if (result.success) {
                toast.success('Спасибо! Обращение отправлено')
                setTitle('')
                setDescription('')
                setScreenshot(null)
                setType('bug')
            } else {
                if (result.fieldErrors) setErrors(result.fieldErrors)
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-card bg-card p-4">
            {/* Тип */}
            <div>
                <label className="mb-2 block text-xs font-medium text-muted">Тип обращения</label>
                <div className="grid grid-cols-3 gap-2">
                    {TYPES.map((t) => {
                        const meta = FEEDBACK_TYPE_META[t]
                        const active = type === t
                        return (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                disabled={isPending}
                                className={cn(
                                    'flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs font-medium transition-all',
                                    active
                                        ? `border-accent ${meta.bgColor} ${meta.color}`
                                        : 'border-card bg-subtle text-muted hover:border-strong'
                                )}
                            >
                                <span className="text-lg">{meta.icon}</span>
                                {meta.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Заголовок */}
            <div>
                <label className="mb-1 block text-xs font-medium text-muted">Заголовок</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isPending}
                    placeholder="Кратко: что случилось или что предлагаешь"
                    className={cn(
                        'w-full rounded-xl border bg-input px-3 py-2.5 text-sm text-main placeholder:text-dim',
                        'focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--accent-color)]/40',
                        errors.title ? 'border-danger' : 'border-card'
                    )}
                />
                {errors.title && <p className="mt-1 text-xs text-danger">{errors.title}</p>}
            </div>

            {/* Описание */}
            <div>
                <label className="mb-1 block text-xs font-medium text-muted">Описание</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isPending}
                    rows={4}
                    placeholder={
                        type === 'bug'
                            ? 'Что ты делал, что произошло, что ожидал вместо этого?'
                            : type === 'idea'
                                ? 'Опиши идею подробно: что улучшить, как это должно работать?'
                                : 'Опиши подробно...'
                    }
                    className={cn(
                        'w-full rounded-xl border bg-input px-3 py-2.5 text-sm text-main placeholder:text-dim resize-y min-h-24',
                        'focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--accent-color)]/40',
                        errors.description ? 'border-danger' : 'border-card'
                    )}
                />
                {errors.description && (
                    <p className="mt-1 text-xs text-danger">{errors.description}</p>
                )}
                <p className="mt-1 text-[10px] text-dim">
                    {description.length} / 3000
                </p>
            </div>

            {/* Скриншот */}
            <div>
                <label className="mb-2 block text-xs font-medium text-muted">
                    Скриншот (по желанию)
                </label>

                {screenshot ? (
                    <div className="relative rounded-xl border border-card bg-subtle p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={screenshot.url}
                            alt="Скриншот"
                            className="max-h-40 w-full rounded-lg object-contain"
                        />
                        <button
                            type="button"
                            onClick={removeScreenshot}
                            disabled={isPending}
                            className="absolute right-3 top-3 rounded-full bg-danger p-1.5 text-white hover:opacity-90"
                            aria-label="Удалить скриншот"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingScreenshot || isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-card bg-subtle px-3 py-4 text-xs text-muted hover:border-strong hover:text-strong transition-colors"
                    >
                        {uploadingScreenshot ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Загружаю...
                            </>
                        ) : (
                            <>
                                <ImageIcon className="h-4 w-4" />
                                Добавить скриншот
                            </>
                        )}
                    </button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            <Button
                type="submit"
                variant="secondary"
                fullWidth
                disabled={isPending || uploadingScreenshot || !title.trim() || !description.trim()}
            >
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Отправляю...
                    </>
                ) : (
                    <>
                        <Send className="mr-2 h-4 w-4" />
                        Отправить
                    </>
                )}
            </Button>
        </form>
    )
}