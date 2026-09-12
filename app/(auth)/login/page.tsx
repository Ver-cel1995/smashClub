'use client'

import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Card} from '@/components/ui/card'
import {LogoBadge} from '@/components/logo-badge'
import {AuthTabs} from '@/components/auth-tabs'
import {AuthFooter} from '@/components/auth-footer'
import {useFormAction} from '@/shared/hooks/useFormAction'
import {signIn} from '@/app/(auth)/actions'
import {TelegramLoginButton} from "@/components/auth/telegram-login-button";
import {MaxLoginButton} from "@/components/auth/max-login-button";

export default function LoginPage() {
    const { isPending, handleSubmit, getFieldError, generalError } = useFormAction(signIn)

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
            <Card className="max-w-sm w-full space-y-6">
                <LogoBadge />

                <AuthTabs active="login" />

                {/* Быстрый вход через мессенджеры */}
                <div className="space-y-2 flex justify-center">
                    <TelegramLoginButton />
                    <MaxLoginButton/>
                </div>

                <div className="relative flex items-center justify-center my-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-subtle" />
                    </div>
                    <span className="relative bg-card px-3 text-[11px] uppercase text-muted font-medium">
                        или через email
                    </span>
                </div>

                {/* Форма email/пароль */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-muted">
                            Email
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="example@mail.com"
                            error={getFieldError('email')}
                            disabled={isPending}
                            className="bg-input border-subtle text-strong"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-muted">
                            Пароль
                        </Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            error={getFieldError('password')}
                            disabled={isPending}
                            className="bg-input border-subtle text-strong"
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

                    {generalError && (
                        <p className="text-sm text-danger text-center">{generalError}</p>
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