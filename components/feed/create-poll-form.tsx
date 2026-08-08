'use client'

import { useState } from 'react'
import { Plus, Trash2, Pin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createPoll } from '@/app/(main)/feed/actions'
import { cn } from '@/shared/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function CreatePollForm() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const [question, setQuestion] = useState('')
    const [description, setDescription] = useState('')
    const [title, setTitle] = useState('')
    const [options, setOptions] = useState([
        { id: crypto.randomUUID(), text: '' },
        { id: crypto.randomUUID(), text: '' },
    ])
    const [multipleChoice, setMultipleChoice] = useState(false)
    const [isPinned, setIsPinned] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const addOption = () => {
        if (options.length >= 10) {
            toast.error('Максимум 10 вариантов')
            return
        }
        setOptions([...options, { id: crypto.randomUUID(), text: '' }])
    }

    const removeOption = (id: string) => {
        if (options.length <= 2) {
            toast.error('Минимум 2 варианта')
            return
        }
        setOptions(options.filter((o) => o.id !== id))
    }

    const updateOption = (id: string, text: string) => {
        setOptions(options.map((o) => (o.id === id ? { ...o, text } : o)))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!question.trim()) {
            setError('Введи вопрос опроса')
            return
        }

        const emptyOptions = options.filter((o) => !o.text.trim())
        if (emptyOptions.length > 0) {
            setError('Заполни все варианты ответа')
            return
        }

        const formData = new FormData()
        formData.set('title', title)
        formData.set('content', description)
        formData.set('poll_question', question)
        formData.set(
            'poll_options',
            JSON.stringify(options.map((o) => ({ id: o.id, text: o.text.trim(), votes: 0 })))
        )
        formData.set('poll_multiple_choice', multipleChoice ? 'on' : '')
        formData.set('is_pinned', isPinned ? 'on' : '')

        startTransition(async () => {
            const result = await createPoll(formData)

            if (result.success) {
                toast.success('Опрос опубликован')
                router.push('/feed')
            } else {
                setError(result.error || 'Ошибка')
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Заголовок */}
            <div className="space-y-2">
                <Label className="text-neutral-300">
                    Заголовок{' '}
                    <span className="text-neutral-500 font-normal">(необязательно)</span>
                </Label>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Например: Голосование за формат турнира"
                    disabled={isPending}
                    className="bg-neutral-900 border-neutral-800 text-white"
                />
            </div>

            {/* Описание */}
            <div className="space-y-2">
                <Label className="text-neutral-300">
                    Описание{' '}
                    <span className="text-neutral-500 font-normal">(необязательно)</span>
                </Label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Дополнительный текст к опросу..."
                    disabled={isPending}
                    rows={3}
                    className={cn(
                        'block w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 resize-none',
                        'focus:outline-none focus:ring-2 focus:border-lime-400/60 focus:ring-lime-400/20',
                        'disabled:opacity-60'
                    )}
                />
            </div>

            {/* Вопрос */}
            <div className="space-y-2">
                <Label className="text-neutral-300">Вопрос опроса</Label>
                <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Какой формат турнира выберем?"
                    disabled={isPending}
                    className="bg-neutral-900 border-neutral-800 text-white"
                />
            </div>

            {/* Варианты */}
            <div className="space-y-2">
                <Label className="text-neutral-300">
                    Варианты ответа ({options.length}/10)
                </Label>

                <div className="space-y-2">
                    {options.map((option, index) => (
                        <div key={option.id} className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 w-5 text-center shrink-0">
                {index + 1}
              </span>
                            <Input
                                value={option.text}
                                onChange={(e) => updateOption(option.id, e.target.value)}
                                placeholder={`Вариант ${index + 1}`}
                                disabled={isPending}
                                className="bg-neutral-900 border-neutral-800 text-white flex-1"
                            />
                            {options.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removeOption(option.id)}
                                    disabled={isPending}
                                    className="rounded-lg p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {options.length < 10 && (
                    <button
                        type="button"
                        onClick={addOption}
                        disabled={isPending}
                        className="flex items-center gap-2 rounded-xl border border-dashed border-neutral-700 px-4 py-2.5 text-sm text-neutral-400 hover:border-neutral-600 hover:text-neutral-300 w-full justify-center transition-colors disabled:opacity-40"
                    >
                        <Plus className="h-4 w-4" />
                        Добавить вариант
                    </button>
                )}
            </div>

            {/* Множественный выбор */}
            <button
                type="button"
                onClick={() => setMultipleChoice(!multipleChoice)}
                disabled={isPending}
                className={cn(
                    'flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors',
                    multipleChoice
                        ? 'border-lime-400/40 bg-lime-400/10'
                        : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                )}
            >
                <div>
                    <p className="text-sm font-medium text-white">Множественный выбор</p>
                    <p className="text-xs text-neutral-400">
                        Можно выбрать несколько вариантов
                    </p>
                </div>
                <div
                    className={cn(
                        'relative h-6 w-11 rounded-full transition-colors',
                        multipleChoice ? 'bg-lime-400' : 'bg-neutral-700'
                    )}
                >
                    <div
                        className={cn(
                            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                            multipleChoice ? 'translate-x-5' : 'translate-x-0.5'
                        )}
                    />
                </div>
            </button>

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

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-lime-400 hover:bg-lime-500 text-neutral-950 font-semibold"
            >
                {isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Публикуем...
                    </>
                ) : (
                    'Опубликовать опрос'
                )}
            </Button>
        </form>
    )
}