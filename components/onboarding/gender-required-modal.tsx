'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { GENDER_LABEL, type Gender } from '@/shared/lib/gender'
import { updateMyGender } from '@/app/(main)/profile/actions'

export function GenderRequiredModal() {
    const [selected, setSelected] = useState<Gender | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleSave = () => {
        if (!selected) return
        startTransition(async () => {
            const result = await updateMyGender(selected)
            if (result.success) {
                toast.success('Спасибо!')
                // Дальше страница перерисуется через revalidatePath
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <Dialog open={true} onOpenChange={() => { /* нельзя закрыть */ }}>
            <DialogContent
                className="border-card bg-elevated sm:max-w-sm"
                hideCloseButton
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogTitle className="text-base font-bold text-strong">
                    Укажи свой пол
                </DialogTitle>
                <p className="text-sm text-muted">
                    Это нужно, чтобы правильно предлагать категории на турнирах.
                    Изменить можно в настройках профиля.
                </p>

                <div className="grid grid-cols-2 gap-2 mt-2">
                    {(['male', 'female'] as const).map((g) => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => setSelected(g)}
                            disabled={isPending}
                            className={cn(
                                'rounded-xl border px-3 py-4 text-sm font-semibold transition-all',
                                selected === g
                                    ? 'border-accent bg-accent-muted text-accent'
                                    : 'border-card bg-subtle text-muted hover:border-strong'
                            )}
                        >
                            <div className="text-2xl mb-1">
                                {g === 'male' ? '👨' : '👩'}
                            </div>
                            {GENDER_LABEL[g]}
                        </button>
                    ))}
                </div>

                <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    disabled={!selected || isPending}
                    onClick={handleSave}
                >
                    {isPending ? 'Сохраняем…' : 'Сохранить'}
                </Button>
            </DialogContent>
        </Dialog>
    )
}