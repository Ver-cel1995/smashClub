'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { LogoBadge } from '@/components/logo-badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProgressAction } from '@/shared/hooks/use-progress-action';
import { updatePassword } from '@/app/(auth)/password-actions';
import { toast } from 'sonner';
import { KeyRound, Loader2, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [runAction, isPending] = useProgressAction();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = (formData: FormData) => {
        setError(null);
        runAction(async () => {
            const result = await updatePassword(formData);
            if (!result.success) {
                setError(result.error || 'Ошибка при изменении пароля');
                toast.error(result.error || 'Ошибка');
                return;
            }

            setSuccess(true);
            toast.success('Пароль успешно изменён!');

            setTimeout(() => {
                router.push('/home');
            }, 1500);
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-app px-4 py-10">
            <Card className="w-full max-w-sm space-y-6 bg-card border-card p-6 shadow-card">
                <LogoBadge />

                {!success ? (
                    <>
                        <div className="space-y-1 text-center">
                            <h2 className="text-lg font-semibold text-strong">
                                Новый пароль
                            </h2>
                            <p className="text-sm text-muted">
                                Придумайте надежный пароль для вашего аккаунта
                            </p>
                        </div>

                        <form action={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-main">
                                    Новый пароль
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Минимум 6 символов"
                                    required
                                    disabled={isPending}
                                    className="bg-input border-card text-strong placeholder:text-dim focus:border-accent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-main">
                                    Повторите пароль
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Повторите новый пароль"
                                    required
                                    disabled={isPending}
                                    className="bg-input border-card text-strong placeholder:text-dim focus:border-accent"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-danger-muted border border-danger/20 text-center text-xs text-danger font-medium">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
                            >
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Сохранение...
                  </span>
                                ) : (
                                    'Сохранить новый пароль'
                                )}
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 py-4">
                        <div className="w-14 h-14 mx-auto rounded-full bg-success-muted flex items-center justify-center text-success">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-lg font-bold text-strong">Пароль обновлён!</h2>
                            <p className="text-sm text-muted">
                                Перенаправляем в приложение...
                            </p>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}