'use client'

import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Card} from '@/components/ui/card'
import {LogoBadge} from '@/components/logo-badge'
import {AuthTabs} from "@/components/auth-tabs";
import {AuthFooter} from "@/components/auth-footer";
import {useFormAction} from "@/shared/hooks/useFormAction";
import {signIn} from "@/app/(auth)/actions";

export default function LoginPage() {
    const { isPending, handleSubmit, getFieldError, generalError } = useFormAction(signIn)

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
            <Card className="max-w-sm space-y-6">
                <LogoBadge />

                <AuthTabs active="login" />

                {/* Форма */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-neutral-300">
                            Email
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="example@mail.com"
                            error={getFieldError('name')}
                            disabled={isPending}

                            className="bg-neutral-900 border-neutral-800 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-neutral-300">
                            Пароль
                        </Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            error={getFieldError('password')}
                            disabled={isPending}
                            className="bg-neutral-900 border-neutral-800 text-white"
                        />
                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-xs font-medium text-accent hover:underline"
                            >
                                Забыли пароль?
                            </Link>
                        </div>
                    </div>

                    {generalError && !Object.keys(getFieldError('_') ? { _: '' } : {}).length && (
                        <p className="text-sm text-red-400 text-center">{generalError}</p>
                    )}

                    <Button
                        type="submit"
                        variant="secondary"
                        disabled={isPending}
                        className="w-full font-semibold"
                    >
                        {isPending ? 'Входим...' : 'Войти'}
                    </Button>
                </form>

                <AuthFooter />
            </Card>
        </div>
    )
}