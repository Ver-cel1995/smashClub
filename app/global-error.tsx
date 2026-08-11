'use client'

import { useEffect } from 'react'

export default function GlobalError({
                                        error,
                                        reset,
                                    }: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[GlobalError]', error)
    }, [error])

    return (
        <html lang="ru">
        <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 p-6 text-center">
            <span className="text-5xl">😵</span>
            <h1 className="text-xl font-bold text-white">
                Что-то пошло не так
            </h1>
            <p className="max-w-md text-sm text-neutral-500">
                Произошла ошибка. Попробуй обновить страницу.
            </p>
            <button
                onClick={reset}
                className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-neutral-950 transition active:scale-95"
            >
                Попробовать снова
            </button>
        </div>
        </body>
        </html>
    )
}