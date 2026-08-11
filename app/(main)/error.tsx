'use client'

import { useEffect } from 'react'
import { RotateCw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MainError({
                                      error,
                                      reset,
                                  }: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[MainError Boundary]', error)
    }, [error])

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-7 w-7" />
            </div>

            <h2 className="mb-2 text-lg font-bold text-white">
                Произошла ошибка загрузки
            </h2>

            <p className="mb-6 max-w-xs text-xs text-neutral-400">
                Не удалось обновить данные. Проверьте подключение к сети и попробуйте снова.
            </p>

            <Button
                variant="secondary"
                size="md"
                onClick={() => reset()}
                className="gap-2"
            >
                <RotateCw className="h-4 w-4" />
                Повторить попытку
            </Button>
        </div>
    )
}