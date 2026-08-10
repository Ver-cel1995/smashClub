'use client'

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type ConfirmVariant = 'default' | 'danger'

type ConfirmOptions = {
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: ConfirmVariant
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<ConfirmOptions | null>(null)
    const resolverRef = useRef<((value: boolean) => void) | null>(null)

    const confirm = useCallback<ConfirmFn>((opts) => {
        setOptions(opts)
        setOpen(true)
        return new Promise<boolean>((resolve) => {
            resolverRef.current = resolve
        })
    }, [])

    const handleResult = useCallback((result: boolean) => {
        resolverRef.current?.(result)
        resolverRef.current = null
        setOpen(false)
    }, [])

    const handleOpenChange = useCallback(
        (value: boolean) => {
            if (!value) handleResult(false)
        },
        [handleResult]
    )

    const contextValue = useMemo(() => confirm, [confirm])

    return (
        <ConfirmContext.Provider value={contextValue}>
            {children}

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent hideCloseButton className="max-w-sm">
                    {options && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{options.title}</DialogTitle>
                                {options.description && (
                                    <DialogDescription>{options.description}</DialogDescription>
                                )}
                            </DialogHeader>

                            <div className="mt-4 flex gap-2">
                                <Button
                                    variant="outline"
                                    fullWidth
                                    onClick={() => handleResult(false)}
                                    className={'bg-neutral-800/60'}
                                >
                                    {options.cancelText ?? 'Отмена'}
                                </Button>
                                <Button
                                    variant={options.variant === 'danger' ? 'danger' : 'secondary'}
                                    fullWidth
                                    onClick={() => handleResult(true)}
                                >
                                    {options.confirmText ?? 'Подтвердить'}
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </ConfirmContext.Provider>
    )
}

export function useConfirm(): ConfirmFn {
    const ctx = useContext(ConfirmContext)
    if (!ctx) {
        throw new Error('useConfirm must be used within ConfirmProvider')
    }
    return ctx
}