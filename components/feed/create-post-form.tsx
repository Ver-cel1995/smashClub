'use client'

import { useState } from 'react'
import { Pin, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormAction } from '@/shared/hooks/useFormAction'
import { createPost } from '@/app/(main)/feed/actions'
import { cn } from '@/shared/lib/utils'

const MAX_CONTENT_LENGTH = 5000

export function CreatePostForm() {
    const { isPending, handleSubmit, getFieldError, generalError } =
        useFormAction(createPost, {
            redirectTo: '/feed',
            successMessage: 'Пост опубликован',
        })

    const [content, setContent] = useState('')
    const [isPinned, setIsPinned] = useState(false)

    const remainingChars = MAX_CONTENT_LENGTH - content.length

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Заголовок */}
            <div className="space-y-2">
                <Label htmlFor="title" className="text-neutral-300">
                    Заголовок <span className="text-neutral-500 font-normal">(необязательно)</span>
                </Label>
                <Input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="Например: Едем на турнир в Краснодар"
                    disabled={isPending}
                    error={getFieldError('title')}
                />
            </div>

            {/* Контент */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="content" className="text-neutral-300">
                        Текст поста
                    </Label>
                    <span
                        className={cn(
                            'text-xs',
                            remainingChars < 200 ? 'text-orange-400' : 'text-neutral-500',
                            remainingChars < 0 && 'text-red-400 font-semibold'
                        )}
                    >
            {remainingChars}
          </span>
                </div>
                <textarea
                    id="content"
                    name="content"
                    rows={8}
                    placeholder="Что расскажешь клубу?"
                    disabled={isPending}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className={cn(
                        'block w-full rounded-2xl border bg-neutral-900 px-4 py-3.5 text-sm text-white placeholder:text-neutral-500 resize-none',
                        'transition-colors duration-150',
                        'focus:outline-none focus:ring-2',
                        getFieldError('content')
                            ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-neutral-800 focus:border-lime-400/60 focus:ring-lime-400/20',
                        'disabled:cursor-not-allowed disabled:opacity-60'
                    )}
                />
                {getFieldError('content') && (
                    <p className="text-xs text-red-400">{getFieldError('content')}</p>
                )}
            </div>

            {/* Настройки: закрепить + push */}
            <div className="space-y-2">
                <button
                    type="button"
                    onClick={() => setIsPinned(!isPinned)}
                    disabled={isPending}
                    className={cn(
                        'flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors',
                        isPinned
                            ? 'border-lime-400/40 bg-lime-400/10'
                            : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                    )}
                >
                    <div className="flex items-center gap-3">
                        <Pin
                            className={cn(
                                'h-5 w-5',
                                isPinned ? 'text-lime-400' : 'text-neutral-400'
                            )}
                        />
                        <div>
                            <p className="text-sm font-medium text-white">Закрепить</p>
                            <p className="text-xs text-neutral-400">
                                Отображать на главной как объявление
                            </p>
                        </div>
                    </div>
                    <div
                        className={cn(
                            'relative h-6 w-11 rounded-full transition-colors',
                            isPinned ? 'bg-lime-400' : 'bg-neutral-700'
                        )}
                    >
                        <div
                            className={cn(
                                'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                                isPinned ? 'translate-x-5' : 'translate-x-0.5'
                            )}
                        />
                    </div>
                </button>
                {/* Скрытый инпут для FormData */}
                <input type="hidden" name="is_pinned" value={isPinned ? 'on' : ''} />

                {/* Заглушка для push (пока не реализовано) */}
                <div className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 opacity-60">
                    <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-neutral-400" />
                        <div>
                            <p className="text-sm font-medium text-white">Отправить push</p>
                            <p className="text-xs text-neutral-400">Скоро будет доступно</p>
                        </div>
                    </div>
                </div>
            </div>

            {generalError && (
                <p className="text-sm text-red-400 text-center">{generalError}</p>
            )}

            {/* Кнопки */}
            <div className="flex gap-3 pt-2">
                <Button
                    type="submit"
                    disabled={isPending || remainingChars < 0}
                    className="flex-1 bg-lime-400 hover:bg-lime-500 text-neutral-950 font-semibold"
                >
                    {isPending ? 'Публикуем...' : 'Опубликовать'}
                </Button>
            </div>
        </form>
    )
}