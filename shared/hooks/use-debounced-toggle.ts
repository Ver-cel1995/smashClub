'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Options<K extends string> = {
    /** Начальное серверное состояние: { emoji: true|false } */
    initial: Record<K, boolean>
    /** Функция, отправляющая запрос */
    commit: (key: K, shouldBeActive: boolean) => Promise<void> | void
    /** Задержка в мс перед отправкой */
    delay?: number
}

/**
 * Хук для мгновенного тоггла с debounced-коммитом на сервер.
 * UI обновляется сразу, запрос летит только когда пользователь "успокоился".
 */
export function useDebouncedToggle<K extends string>({
                                                         initial,
                                                         commit,
                                                         delay = 400,
                                                     }: Options<K>) {
    // Локальное optimistic-состояние
    const [state, setState] = useState<Record<K, boolean>>(initial)

    // Ссылка на серверное состояние (что мы уже подтвердили)
    const serverStateRef = useRef<Record<K, boolean>>(initial)

    // Таймеры на каждый ключ
    const timersRef = useRef<Map<K, ReturnType<typeof setTimeout>>>(new Map())

    // Очистка при размонтировании
    useEffect(() => {
        return () => {
            timersRef.current.forEach((t) => clearTimeout(t))
            timersRef.current.clear()
        }
    }, [])

    const toggle = useCallback(
        (key: K) => {
            setState((prev) => {
                const next = { ...prev, [key]: !prev[key] }

                // Сброс предыдущего таймера для этого ключа
                const existing = timersRef.current.get(key)
                if (existing) clearTimeout(existing)

                // Ставим новый таймер
                const timer = setTimeout(async () => {
                    timersRef.current.delete(key)
                    const desired = next[key]
                    const serverHas = serverStateRef.current[key]

                    // Отправляем только если реально отличается
                    if (desired !== serverHas) {
                        try {
                            await commit(key, desired)
                            serverStateRef.current = {
                                ...serverStateRef.current,
                                [key]: desired,
                            }
                        } catch (e) {
                            console.error('[useDebouncedToggle] commit failed', e)
                            // Откат UI к серверному состоянию
                            setState((s) => ({ ...s, [key]: serverHas }))
                        }
                    }
                }, delay)

                timersRef.current.set(key, timer)
                return next
            })
        },
        [commit, delay]
    )

    return { state, toggle }
}