'use client'

import {useState} from 'react'
import Link from 'next/link'
import {Card} from '@/components/ui/card'
import {LogoBadge} from '@/components/logo-badge'
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useProgressAction} from "@/shared/hooks/use-progress-action";

export default function ForgotPasswordPage() {
    const [runAction, isPending] = useProgressAction()
    const [error, setError] = useState<string | null>(null)
    const [sent, setSent] = useState(false)

    const handleSubmit = (formData: FormData) => {
        // setError(null)
        // runAction(async () => {
        //     const result = await requestPasswordReset(formData)
        //     if (!result.success) {
        //         setError(result.error || 'Что-то пошло не так')
        //         toast.error(result.error || 'Ошибка')
        //         return
        //     }
        //     setSent(true)
        //     toast.success('Инструкция отправлена на почту')
        // })
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-10">
            <Card className="max-w-sm space-y-6">
                <LogoBadge />

                <div className="space-y-1 text-center">
                    <h2 className="text-lg font-semibold text-white">Восстановление пароля</h2>
                    <p className="text-sm text-neutral-400">
                        Введите email, указанный при регистрации — мы отправим инструкцию по
                        восстановлению доступа
                    </p>
                </div>

                {sent ? (
                    <div className="rounded-2xl border-accent bg-accent-muted p-4 text-center text-sm text-accent">
                        Если аккаунт с таким email существует, письмо с инструкцией уже отправлено.
                    </div>
                ) : (
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-neutral-300">
                                Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="example@mail.com"
                                required
                                disabled={isPending}
                                className="bg-card border-card text-white"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-400 text-center">{error}</p>
                        )}

                        <Button
                            type="submit"
                            variant="secondary"
                            disabled={isPending}
                            className="w-full font-semibold"
                        >
                            {isPending ? 'Отправляем...' : 'Отправить инструкцию'}
                        </Button>
                    </form>
                )}

                <div className="text-center text-sm text-neutral-400">
                    Вспомнили пароль?{' '}
                    <Link href="/login" className="text-accent hover:underline font-medium">
                        Войти
                    </Link>
                </div>
            </Card>
        </div>
    )
}
