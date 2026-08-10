'use client'

import {useActionState, useRef, useState} from 'react'
import {useRouter} from 'next/navigation'
import {Loader2, Pin} from 'lucide-react'
import {toast} from 'sonner'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {PhotoUpload, type PhotoUploadHandle} from './photo-upload'
import {createPost} from '@/app/(main)/feed/actions'
import {cn} from '@/shared/lib/utils'
import {useProgressRouter} from "@/shared/hooks/use-progress-router";
import {TextareaWithEmoji} from "@/components/shared/textarea-with-emoji";

const MAX_CONTENT_LENGTH = 5000

export function CreatePostForm() {
    const router = useProgressRouter()
    const photoRef = useRef<PhotoUploadHandle>(null)
    const formRef = useRef<HTMLFormElement>(null)

    const [content, setContent] = useState('')
    const [isPinned, setIsPinned] = useState(false)

    const remainingChars = MAX_CONTENT_LENGTH - content.length

    // Оборачиваем action чтобы добавить файлы
    const wrappedAction = async (_prev: unknown, formData: FormData) => {
        // Удаляем пустые photos если есть
        formData.delete('photos')

        // Добавляем файлы из ref
        const files = photoRef.current?.getFiles() || []
        for (const file of files) {
            formData.append('photos', file)
        }

        formData.set('is_pinned', isPinned ? 'on' : '')

        const result = await createPost(formData)

        if (result.success) {
            toast.success('Пост опубликован')
            router.push('/feed')
        } else {
            toast.error(result.error || 'Ошибка')
        }

        return result
    }

    const [state, formAction, isPending] = useActionState(wrappedAction, null)

    const fieldErrors = (state && !state.success && 'fieldErrors' in state)
        ? (state.fieldErrors || {})
        : {}

    const getFieldError = (field: string) =>
        (fieldErrors as Record<string, string>)[field]

    return (
        <form ref={formRef} action={formAction} className="space-y-4" noValidate>
            {/* Заголовок */}
            <div className="space-y-2">
                <Label htmlFor="title" className="text-neutral-300">
                    Заголовок{' '}
                    <span className="text-neutral-500 font-normal">(необязательно)</span>
                </Label>
                <Input
                    id="title"
                    name="title"
                    placeholder="Например: Едем на турнир в Краснодар"
                    disabled={isPending}
                    className="bg-neutral-900 border-neutral-800 text-white"
                />
                {getFieldError('title') && (
                    <p className="text-xs text-red-400">{getFieldError('title')}</p>
                )}
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
                <TextareaWithEmoji
                    name="content"
                    value={content}
                    onChange={setContent}
                    placeholder="Расскажи что-нибудь..."
                    maxLength={2000}
                    minHeight={120}
                />
                {getFieldError('content') && (
                    <p className="text-xs text-red-400">{getFieldError('content')}</p>
                )}
            </div>

            {/* Фото и файлы */}
            <div className="space-y-2">
                <Label className="text-neutral-300">Вложения</Label>
                <PhotoUpload ref={photoRef} disabled={isPending} />
            </div>

            {/* Закрепить */}
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
                    <Pin className={cn('h-5 w-5', isPinned ? 'text-lime-400' : 'text-neutral-400')} />
                    <div>
                        <p className="text-sm font-medium text-white">Закрепить</p>
                        <p className="text-xs text-neutral-400">На главной как объявление</p>
                    </div>
                </div>
                <div className={cn('relative h-6 w-11 rounded-full transition-colors', isPinned ? 'bg-lime-400' : 'bg-neutral-700')}>
                    <div className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform', isPinned ? 'translate-x-5' : 'translate-x-0.5')} />
                </div>
            </button>

            {state && !state.success && 'error' in state && (
                <p className="text-sm text-red-400 text-center">{state.error}</p>
            )}

            <Button
                type="submit"
                disabled={isPending || remainingChars < 0}
                className="w-full bg-lime-400 hover:bg-lime-500 text-neutral-950 font-semibold"
            >
                {isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Публикуем...
                    </>
                ) : (
                    'Опубликовать'
                )}
            </Button>
        </form>
    )
}