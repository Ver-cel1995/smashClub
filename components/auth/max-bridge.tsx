'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function MaxBridge() {
    const searchParams = useSearchParams();

    useEffect(() => {
        // 1. Проверяем, есть ли данные от МАХ (обычно в URL или window.Max)
        const initData = searchParams.get('max_init_data') ||
            searchParams.get('initData') ||
            (typeof window !== 'undefined' && (window as any).Max?.initData);

        // 2. Ищем код подтверждения (МАХ передает параметр start как start_param)
        const startParam = searchParams.get('start_param') || searchParams.get('start');

        if (initData && startParam) {
            // Мы внутри МАХ и у нас есть код для подтверждения!
            confirmAuth(initData, startParam);
        }
    }, [searchParams]);

    async function confirmAuth(initData: string, code: string) {
        try {
            const res = await fetch('/api/auth/max/confirm-bridge', {
                method: 'POST',
                body: JSON.stringify({ initData, code }),
            });

            if (res.ok) {
                toast.success('Вход подтвержден! Вернитесь в основной браузер.');
            }
        } catch (e) {
            console.error('Bridge error', e);
        }
    }

    return null; // Компонент ничего не рендерит
}