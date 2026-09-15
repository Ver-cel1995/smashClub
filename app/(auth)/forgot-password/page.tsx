'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { LogoBadge } from '@/components/logo-badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProgressAction } from '@/shared/hooks/use-progress-action';
import { requestPasswordReset } from '@/app/(auth)/password-actions';
import { toast } from 'sonner';
import {
    MailCheck,
    ExternalLink,
    ArrowLeft,
    Loader2,
    CheckCircle2,
} from 'lucide-react';

// Определение почтового провайдера по домену email

interface EmailProviderInfo {
    name: string;
    url: string;
}

function getEmailProviderInfo(email: string): EmailProviderInfo | null {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;

    if (['gmail.com', 'googlemail.com'].includes(domain)) {
        return { name: 'Gmail', url: 'https://mail.google.com' };
    }
    if (
        ['yandex.ru', 'yandex.com', 'ya.ru', 'yandex.by', 'yandex.kz'].includes(
            domain
        )
    ) {
        return { name: 'Яндекс Почту', url: 'https://mail.yandex.ru' };
    }
    if (['mail.ru', 'inbox.ru', 'list.ru', 'bk.ru'].includes(domain)) {
        return { name: 'Mail.ru', url: 'https://e.mail.ru' };
    }
    if (['vk.com', 'internet.ru'].includes(domain)) {
        return { name: 'VK Почту', url: 'https://mail.vk.com' };
    }
    if (
        ['rambler.ru', 'lenta.ru', 'autorambler.ru', 'myrambler.ru'].includes(domain)
    ) {
        return { name: 'Рамблер Почту', url: 'https://mail.rambler.ru' };
    }
    if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain)) {
        return { name: 'Outlook', url: 'https://outlook.live.com' };
    }
    if (['icloud.com', 'me.com', 'mac.com'].includes(domain)) {
        return { name: 'iCloud Mail', url: 'https://www.icloud.com/mail' };
    }

    return null;
}

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [runAction, isPending] = useProgressAction();
    const [error, setError] = useState<string | null>(null);

    // Состояние после успешной отправки
    const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const handleSubmit = (formData: FormData) => {
        setError(null);
        runAction(async () => {
            const result = await requestPasswordReset(formData);
            if (!result.success) {
                setError(result.error || 'Что-то пошло не так');
                toast.error(result.error || 'Ошибка отправки');
                return;
            }

            if (result.data?.email) {
                setSubmittedEmail(result.data.email);
                toast.success('Инструкция отправлена на почту!');
            }
        });
    };

    // Плавный переход к авторизации с лоадером
    const handleGoToLogin = () => {
        setIsNavigating(true);
        setTimeout(() => {
            router.push('/login');
        }, 400);
    };

    // Переход в веб-почту пользователя
    const handleOpenEmailClient = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const providerInfo = submittedEmail
        ? getEmailProviderInfo(submittedEmail)
        : null;

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
            <Card className="w-full max-w-sm space-y-6 bg-card border-card p-6 shadow-card">
                <LogoBadge />

                {!submittedEmail ? (
                    /* Форма ввода Email */
                    <>
                        <div className="space-y-1 text-center">
                            <h2 className="text-lg font-semibold text-strong">
                                Восстановление пароля
                            </h2>
                            <p className="text-sm text-muted">
                                Введите email, указанный при регистрации — мы отправим ссылку для
                                восстановления доступа
                            </p>
                        </div>

                        <form action={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-main">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="example@mail.com"
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
                    Отправка...
                  </span>
                                ) : (
                                    'Отправить инструкцию'
                                )}
                            </Button>
                        </form>

                        <div className="text-center text-sm text-muted">
                            Вспомнили пароль?{' '}
                            <Link
                                href="/login"
                                className="text-accent hover:underline font-medium"
                            >
                                Войти
                            </Link>
                        </div>
                    </>
                ) : (
                    /* Модальный блок результата после отправки */
                    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 mx-auto rounded-full bg-accent-muted flex items-center justify-center text-accent">
                            <MailCheck className="w-7 h-7" />
                        </div>

                        <div className="space-y-2 text-center">
                            <h2 className="text-lg font-bold text-strong">
                                Проверьте почту
                            </h2>
                            <p className="text-sm text-muted leading-relaxed">
                                Мы отправили инструкцию по сбросу пароля на адрес:
                            </p>
                            <div className="inline-block bg-subtle px-3 py-1.5 rounded-lg text-sm font-mono font-medium text-strong border border-subtle break-all">
                                {submittedEmail}
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            {/* Кнопка мгновенного перехода в почтовый сервис */}
                            {providerInfo ? (
                                <Button
                                    type="button"
                                    onClick={() => handleOpenEmailClient(providerInfo.url)}
                                    className="w-full font-semibold bg-accent text-accent-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Открыть {providerInfo.name}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={() => handleOpenEmailClient(`mailto:${submittedEmail}`)}
                                    className="w-full font-semibold bg-accent text-accent-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Открыть почтовый клиент
                                </Button>
                            )}

                            {/* Кнопка возврата к авторизации с анимированным лоадером */}
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isNavigating}
                                onClick={handleGoToLogin}
                                className="w-full border-card hover:bg-hover text-main font-medium flex items-center justify-center gap-2"
                            >
                                {isNavigating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-accent" />
                                        Переход к входу...
                                    </>
                                ) : (
                                    <>
                                        <ArrowLeft className="w-4 h-4" />
                                        Авторизация
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 text-xs text-dim text-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                            <span>Ссылка действительна в течение 24 часов</span>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}