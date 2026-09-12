/**
 * Вспомогательные функции для работы с MAX Messenger API (platform-api2.max.ru)
 */

const MAX_BOT_TOKEN = process.env.MAX_BOT_TOKEN;
const MAX_API_BASE = 'https://platform-api2.max.ru';

/**
 * Отправляет текстовое сообщение пользователю в МАХ
 */
export async function sendMaxMessage(chatId: string | number, text: string) {
    if (!MAX_BOT_TOKEN) {
        console.warn('[MAX Bot] MAX_BOT_TOKEN не задан в ENV');
        return false;
    }

    try {
        const res = await fetch(`${MAX_API_BASE}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': MAX_BOT_TOKEN,
            },
            body: JSON.stringify({
                chat_id: chatId,
                text,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('[MAX Bot] Ошибка отправки сообщения:', err);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[MAX Bot] Исключение при отправке:', error);
        return false;
    }
}

/**
 * Регистрирует Webhook URL в MAX API (POST /subscriptions)
 */
export async function registerMaxWebhook(webhookUrl: string) {
    if (!MAX_BOT_TOKEN) {
        return { success: false, error: 'MAX_BOT_TOKEN отсутствует в ENV' };
    }

    try {
        const res = await fetch(`${MAX_API_BASE}/subscriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': MAX_BOT_TOKEN,
            },
            body: JSON.stringify({
                url: webhookUrl,
                update_types: ['message_created', 'bot_started'],
            }),
        });

        const data = await res.json();
        return { success: res.ok && data.success !== false, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}