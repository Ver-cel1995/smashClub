'use client'

import {FormEvent, useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { ActionResult } from '@/shared/lib/actions/types'

interface UseFormActionOptions {
    /** Куда перейти после успешного выполнения */
    redirectTo?: string
    /** Сообщение toast при успехе */
    successMessage?: string
    /** Колбэк при успехе */
    onSuccess?: () => void
}

export function useFormAction<T = void>(
    action: (formData: FormData) => Promise<ActionResult<T>>,
    options: UseFormActionOptions = {}
) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [generalError, setGeneralError] = useState<string | null>(null)

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setFieldErrors({})
        setGeneralError(null)

        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            const result = await action(formData)

            if (result.success) {
                if (options.successMessage) {
                    toast.success(options.successMessage)
                }
                options.onSuccess?.()
                if (options.redirectTo) {
                    router.push(options.redirectTo)
                }
            } else {
                if (result.fieldErrors) {
                    setFieldErrors(result.fieldErrors)
                }
                setGeneralError(result.error)
                toast.error(result.error)
            }
        })
    }

    return {
        isPending,
        fieldErrors,
        generalError,
        handleSubmit,
        getFieldError: (field: string) => fieldErrors[field],
    }
}