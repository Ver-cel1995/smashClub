import { useCallback, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useProgressRouter } from '@/shared/hooks/use-progress-router'
import { useProgressAction } from '@/shared/hooks/use-progress-action'
import {ActionResult} from "@/shared/lib/actions/types";

interface UseFormActionOptions {
    redirectTo?: string
    successMessage?: string
    onSuccess?: () => void
}

export function useFormAction<T = void>(
    action: (formData: FormData) => Promise<ActionResult<T>>,
    options: UseFormActionOptions = {}
) {
    const router = useProgressRouter()
    const [runAction, isPending] = useProgressAction() // [функция, boolean]
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [generalError, setGeneralError] = useState<string | null>(null)

    const { redirectTo, successMessage, onSuccess } = options

    const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setFieldErrors({})
        setGeneralError(null)

        const formData = new FormData(e.currentTarget)

        runAction(async () => {
            const result = await action(formData)

            if (result.success) {
                if (successMessage) {
                    toast.success(successMessage)
                }
                onSuccess?.()
                if (redirectTo) {
                    router.push(redirectTo)
                }
            } else {
                if (result.fieldErrors) {
                    setFieldErrors(result.fieldErrors)
                }
                setGeneralError(result.error)
                toast.error(result.error)
            }
        })
    }, [action, runAction, router, redirectTo, successMessage, onSuccess])

    const getFieldError = useCallback((field: string) => fieldErrors[field], [fieldErrors])

    return {
        isPending,
        fieldErrors,
        generalError,
        handleSubmit,
        getFieldError,
    }
}