import { NextResponse } from 'next/server';
import { registerMaxWebhook } from '@/shared/lib/max/bot-api';

/**
 * Эндпоинт для однократной регистрации Webhook URL в MAX API
 * Вызывается просто вводом в браузере: https://smash-club-three.vercel.app/api/dev/setup-max-webhook
 */
export async function GET() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smash-club-three.vercel.app';
    const webhookUrl = `${appUrl}/api/webhooks/max`;

    console.log(`[MAX Setup] Регистрируем webhook URL: ${webhookUrl}`);

    const result = await registerMaxWebhook(webhookUrl);

    return NextResponse.json({
        message: 'Результат регистрации Webhook в МАХ',
        target_webhook_url: webhookUrl,
        result,
    });
}