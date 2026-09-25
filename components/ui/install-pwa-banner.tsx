'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, X, Share, PlusSquare, Menu, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── ОПРЕДЕЛЕНИЕ БРАУЗЕРА ─────────────────────────────────────
type BrowserInfo = {
    name: string;
    isIOS: boolean;
    isAndroid: boolean;
    supportsAutoInstall: boolean;
    manualInstruction: string;
    manualIcon: 'share' | 'menu';
    manualStep2: string;
};

function detectBrowser(): BrowserInfo {
    const ua = navigator.userAgent.toLowerCase();

    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    // ─── ВСЕ iOS-БРАУЗЕРИ ────────────────────────────────────
    if (isIOS) {
        // Определяем конкретный iOS-браузер для инструкции
        if (ua.includes('yabrowser')) {
            return {
                name: 'Яндекс.Браузер',
                isIOS: true,
                isAndroid: false,
                supportsAutoInstall: false,
                manualInstruction: 'Внизу экрана нажмите кнопку «Поделиться»',
                manualIcon: 'share',
                manualStep2: 'Выберите «На экран «Домой»»',
            };
        }
        if (ua.includes('crios') || ua.includes('chrome')) {
            return {
                name: 'Google Chrome',
                isIOS: true,
                isAndroid: false,
                supportsAutoInstall: false,
                manualInstruction: 'Нажмите кнопку «Поделиться» внизу экрана',
                manualIcon: 'share',
                manualStep2: 'Выберите «На экран «Домой»»',
            };
        }
        // Safari (по умолчанию)
        return {
            name: 'Safari',
            isIOS: true,
            isAndroid: false,
            supportsAutoInstall: false,
            manualInstruction: 'Нажмите кнопку «Поделиться» внизу экрана',
            manualIcon: 'share',
            manualStep2: 'Выберите «На экран «Домой»»',
        };
    }

    // ─── ANDROID-БРАУЗЕРЫ ─────────────────────────────────────
    if (isAndroid) {
        // Яндекс.Браузер (Chromium → поддерживает auto-install)
        if (ua.includes('yabrowser')) {
            return {
                name: 'Яндекс.Браузер',
                isIOS: false,
                isAndroid: true,
                supportsAutoInstall: true,
                manualInstruction: 'Откройте меню «⋮» (три точки) внизу справа',
                manualIcon: 'menu',
                manualStep2: 'Нажмите «Добавить на главный экран»',
            };
        }
        // Samsung Internet
        if (ua.includes('samsungbrowser')) {
            return {
                name: 'Samsung Internet',
                isIOS: false,
                isAndroid: true,
                supportsAutoInstall: true,
                manualInstruction: 'Нажмите меню «☰» в правом нижнем углу',
                manualIcon: 'menu',
                manualStep2: 'Выберите «Добавить на главный экран»',
            };
        }
        // Opera
        if (ua.includes('opr') || ua.includes('opera')) {
            return {
                name: 'Opera',
                isIOS: false,
                isAndroid: true,
                supportsAutoInstall: true,
                manualInstruction: 'Нажмите меню «⋮» внизу',
                manualIcon: 'menu',
                manualStep2: 'Выберите «Добавить на главный экран»',
            };
        }
        // Firefox
        if (ua.includes('firefox')) {
            return {
                name: 'Firefox',
                isIOS: false,
                isAndroid: true,
                supportsAutoInstall: false,
                manualInstruction: 'Нажмите меню «⋮» справа сверху',
                manualIcon: 'menu',
                manualStep2: 'Выберите «Добавить на главный экран»',
            };
        }
        // Google Chrome (по умолчанию на Android)
        return {
            name: 'Google Chrome',
            isIOS: false,
            isAndroid: true,
            supportsAutoInstall: true,
            manualInstruction: 'Нажмите меню «⋮» справа сверху',
            manualIcon: 'menu',
            manualStep2: 'Выберите «Установить приложение» или «Добавить на главный экран»',
        };
    }

    // ─── ДЕСКТОП / НЕИЗВЕСТНЫЕ ───────────────────────────────
    return {
        name: navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Ваш браузер',
        isIOS: false,
        isAndroid: false,
        supportsAutoInstall: true,
        manualInstruction: 'Откройте меню браузера',
        manualIcon: 'menu',
        manualStep2: 'Найдите пункт «Установить» или «Добавить на главный экран»',
    };
}

// ─── КОМПОНЕНТ БАННЕРА ────────────────────────────────────────
export function InstallPwaBanner() {
    const [browser, setBrowser] = useState<BrowserInfo | null>(null);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Уже запущено как приложение (Standalone)?
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (navigator as any).standalone === true;
        if (isStandalone) {
            setIsInstalled(true);
            return;
        }

        // Пользователь ранее закрыл баннер?
        if (localStorage.getItem('smashclub-pwa-dismissed')) {
            setDismissed(true);
            return;
        }

        // Определяем браузер
        setBrowser(detectBrowser());

        // Ловим событие для auto-install (Chrome, Yandex, Samsung, Opera)
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = useCallback(async () => {
        // Если браузер поддерживает авт установку и событие поймано
        if (deferredPrompt && browser?.supportsAutoInstall) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setIsInstalled(true);
            setDeferredPrompt(null);
            return;
        }

        // Иначе — показываем визуальную инструкцию для КОНКРЕТНОГО браузера
        setShowModal(true);
    }, [deferredPrompt, browser]);

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('smashclub-pwa-dismissed', 'true');
    };

    if (isInstalled || dismissed || !browser) return null;

    // Название кнопки на баннере зависит от ОС
    const buttonLabel = browser.isIOS
        ? 'Установить'
        : deferredPrompt
            ? 'Установить'
            : 'Как установить?';

    return (
        <>
            {/* ── ПЛАВАЮЩИЙ БАННЕР ВНИЗУ ── */}
            <div className="fixed bottom-4 left-4 right-4 z-[90] max-w-md mx-auto bg-card/95 backdrop-blur-md border border-accent/40 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                        <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-strong truncate">
                            SmashClub на рабочий стол
                        </p>
                        <p className="text-[10px] text-muted truncate">
                            Быстрый доступ без браузера
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                        size="sm"
                        onClick={handleInstall}
                        className="h-8 px-3 text-[11px] font-bold bg-accent text-accent-foreground hover:opacity-90 shadow-md"
                    >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        {buttonLabel}
                    </Button>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="p-1 text-muted hover:text-strong rounded-lg"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── МОДАЛЬНОЕ ОКНО С ИНСТРУКЦИЕЙ ДЛЯ КОНКРЕТНОГО БРАУЗЕРА ── */}
            {showModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-card border border-subtle w-full max-w-sm rounded-3xl p-6 shadow-2xl relative space-y-4 text-center">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-1 text-muted hover:text-strong rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto text-accent">
                            <Download className="w-6 h-6" />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-strong">
                                Установка на рабочий стол
                            </h3>
                            <p className="text-xs text-muted">
                                Установка через <strong className="text-accent">{browser.name}</strong> — 2 простых шага:
                            </p>
                        </div>

                        <div className="space-y-3 pt-2 text-left text-xs bg-subtle/40 p-4 rounded-2xl border border-subtle">
                            {/* Шаг 1 */}
                            <div className="flex items-start gap-3">
                                <span className="bg-accent text-accent-foreground w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                    1
                                </span>
                                <p className="text-main leading-snug">
                                    {browser.manualInstruction}
                                    {browser.manualIcon === 'share' && (
                                        <Share className="w-3.5 h-3.5 inline ml-1 text-accent" />
                                    )}
                                    {browser.manualIcon === 'menu' && (
                                        <Menu className="w-3.5 h-3.5 inline ml-1 text-accent" />
                                    )}
                                </p>
                            </div>

                            {/* Шаг 2 */}
                            <div className="flex items-start gap-3">
                                <span className="bg-accent text-accent-foreground w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                    2
                                </span>
                                <p className="text-main leading-snug">
                                    {browser.manualStep2}
                                    <PlusSquare className="w-3.5 h-3.5 inline ml-1 text-accent" />
                                </p>
                            </div>
                        </div>

                        {/* Если ОС Android и браузер поддерживает, но prompt не сработал */}
                        {browser.isAndroid && browser.supportsAutoInstall && !deferredPrompt && (
                            <p className="text-[10px] text-dim italic">
                                Если кнопка меню не видна, обновите страницу или попробуйте
                                открыть через Google Chrome.
                            </p>
                        )}

                        <Button
                            onClick={() => setShowModal(false)}
                            className="w-full h-10 bg-subtle text-strong font-bold hover:bg-hover border border-subtle text-xs"
                        >
                            Понятно
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}