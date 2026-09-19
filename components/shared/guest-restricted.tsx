import Link from 'next/link'
import { Lock, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GuestRestrictedProps {
    title?: string
    description?: string
}

export function GuestRestricted({
                                    title = 'Доступно только для зарегистрированных пользователей',
                                    description = 'Войдите в свой аккаунт или зарегистрируйтесь, чтобы получить полный доступ к расписанию, записи на тренировки и турнирам.',
                                }: GuestRestrictedProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-accent-muted border border-accent/30 flex items-center justify-center mb-5 text-accent shadow-card">
                <Lock className="w-8 h-8" />
            </div>

            <h2 className="text-lg font-bold text-strong mb-2 leading-tight">
                {title}
            </h2>

            <p className="text-xs text-muted mb-8 leading-relaxed max-w-xs">
                {description}
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <Link href="/login" className="w-full">
                    <Button variant="secondary" fullWidth className="gap-2">
                        <LogIn className="w-4 h-4" />
                        Войти в аккаунт
                    </Button>
                </Link>

                <Link href="/register" className="w-full">
                    <Button variant="outline" fullWidth className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Зарегистрироваться
                    </Button>
                </Link>
            </div>
        </div>
    )
}