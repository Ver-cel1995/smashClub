'use client'

import {useCallback, useTransition} from 'react'
import {doneProgress, startProgress} from "@/store/route-progress";

/**
 * Обёртка над useTransition, которая показывает route progress
 * пока action выполняется.
 *
 * const [runAction, isPending] = useProgressAction()
 * runAction(async () => {
 *   await createPost(data)
 * })
 */
export function useProgressAction() {
    const [isPending, startTransition] = useTransition()

    const run = useCallback((action: () => Promise<unknown> | unknown) => {
        startProgress()
        startTransition(async () => {
            try {
                await action()
            } finally {
                doneProgress()
            }
        })
    }, [])

    return [run, isPending] as const
}