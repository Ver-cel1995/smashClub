'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createMaxAuthCode, checkMaxAuthCodeStatus, loginWithDevMax } from '@/app/(auth)/max-actions';
import { Loader2, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function MaxLoginButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [authCode, setAuthCode] = useState<string | null>(null);
    const [deepLink, setDeepLink] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Очистка таймера при размонтировании
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    // Запуск поллинга при открытой модалке
    useEffect(() => {
        if (!modalOpen || !authCode) return;

        pollingRef.current = setInterval(async () => {
            const res = await checkMaxAuthCodeStatus(authCode);

            if (res.status === 'verified' && res.actionLink) {
                if (pollingRef.current) clearInterval(pollingRef.current);
                setVerifying(true);
                toast.success('Авторизация прошла успешно!');
                // Переходим по magic link для установки сессии
                window.location.href = res.actionLink;
            } else if (res.status === 'expired') {
                if (pollingRef.current) clearInterval(pollingRef.current);
                toast.error('Время действия кода истекло. Попробуйте снова.');
                setModalOpen(false);
            }
        }, 2000);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [modalOpen, authCode]);

    const handleStartAuth = async () => {
        setLoading(true);
        try {
            const res = await createMaxAuthCode();

            if (!res.success || !res.code || !res.deepLink) {
                toast.error(res.error || 'Ошибка при генерации кода');
                return;
            }

            setAuthCode(res.code);
            setDeepLink(res.deepLink);
            setModalOpen(true);

            window.open(res.deepLink, '_blank');
        } catch (err) {
            toast.error('Произошла ошибка входа');
        } finally {
            setLoading(false);
        }
    };

    const handleDevSimulate = async () => {
        if (!authCode) return;
        toast.info('Симуляция ответа от мессенджера МАХ...');
        await loginWithDevMax(authCode);
    };

    return (
        <>
            <button
                type="button"
                onClick={handleStartAuth}
                disabled={loading}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0077FF] to-[#00E5FF] hover:opacity-90 active:scale-95 text-white flex items-center justify-center font-bold text-sm shadow-md transition-all disabled:opacity-50"
                title="Войти через МАХ"
                aria-label="Войти через МАХ"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <span className="tracking-tighter font-extrabold text-base">MAX</span>
                )}
            </button>

            {/* Модальное окно ожидания входа */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-card rounded-2xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#0077FF] to-[#00E5FF] flex items-center justify-center text-white font-black text-xl shadow-lg">
                            MAX
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-strong">Подтвердите вход</h3>
                            <p className="text-sm text-muted">
                                Откройте бота в мессенджере МАХ и нажмите <strong>«Запустить»</strong>
                            </p>
                        </div>

                        {/* Блок с кодом */}
                        <div className="bg-subtle p-4 rounded-xl border border-subtle">
                            <span className="text-xs text-dim block mb-1">Код авторизации:</span>
                            <span className="text-3xl font-mono font-bold tracking-widest text-accent">
                {authCode}
              </span>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            {deepLink && (
                                <a
                                    href={deepLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 px-4 rounded-xl bg-accent text-accent-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Перейти в МАХ
                                </a>
                            )}

                            {/* Dev симулятор */}
                            {process.env.NODE_ENV === 'development' && (
                                <button
                                    type="button"
                                    onClick={handleDevSimulate}
                                    className="w-full py-2 px-3 rounded-lg bg-warning/20 text-warning text-xs font-mono flex items-center justify-center gap-1.5 hover:bg-warning/30 transition-colors"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    🧪 Симулировать вход в MAX (Dev)
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="w-full py-2 text-sm text-muted hover:text-strong transition-colors mt-1"
                            >
                                Отмена
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 text-xs text-dim">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                            <span>Ожидание ответа от мессенджера...</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}