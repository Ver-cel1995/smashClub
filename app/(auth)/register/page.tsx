'use client'

import {signUp} from '../actions'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Card} from '@/components/ui/card'
import {AuthFooter} from "@/components/auth-footer";
import {LogoBadge} from "@/components/logo-badge";
import {AuthTabs} from "@/components/auth-tabs";
import {useFormAction} from "@/shared/hooks/useFormAction";
import Link from 'next/link'
import {useState} from "react";

export default function RegisterPage() {
    const {isPending, handleSubmit, getFieldError, generalError} = useFormAction(signUp)
    const [consentGiven, setConsentGiven] = useState(false);

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
            <Card className="max-w-sm space-y-6">
                <LogoBadge/>

                <AuthTabs active="register"/>

                {/* Форма */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-neutral-300">
                            Имя
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Как к вам обращаться"
                            disabled={isPending}
                            error={getFieldError('name')}
                            className="bg-card border text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-neutral-300">
                            Email
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="example@mail.com"
                            error={getFieldError('email')}
                            disabled={isPending}
                            className="bg-card border text-white"
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
                            className="bg-card border text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-neutral-300">
                            Подтвердите пароль
                        </Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            error={getFieldError('confirmPassword')}
                            disabled={isPending}
                            className="bg-card border text-white"
                        />
                    </div>

                    {generalError && !Object.keys(getFieldError('_') ? {_: ''} : {}).length && (
                        <p className="text-sm text-red-400 text-center">{generalError}</p>
                    )}


                    <label className="flex items-start gap-3 text-sm text-main cursor-pointer">
                        <input
                            type="checkbox"
                            checked={consentGiven}
                            onChange={(e) => setConsentGiven(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-subtle text-accent focus:ring-accent"
                            required
                        />
                        <span>
                                Я даю согласие на обработку персональных данных в соответствии с{' '}
                            <Link href="/privacy" className="text-accent underline" target="_blank">
                                Политикой конфиденциальности
                            </Link>{' '} и принимаю{' '}

                            <Link href="/terms" className="text-accent underline" target="_blank">
                                Пользовательское соглашение
                            </Link>
                        </span>
                    </label>

                    <Button
                        type="submit"
                        variant="secondary"
                        disabled={isPending || !consentGiven}
                        className="w-full font-semibold"
                    >
                        {isPending ? 'Регистрируем...' : 'Зарегистрироваться'}
                    </Button>
                </form>
                <AuthFooter/>
            </Card>
        </div>
    )
}