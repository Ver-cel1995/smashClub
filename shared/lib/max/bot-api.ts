import https from 'https';

const MAX_BOT_TOKEN = process.env.MAX_BOT_TOKEN;
const MAX_API_BASE = 'platform-api2.max.ru'; // Без https://

/**
 * Универсальный исполнитель запросов к MAX API с поддержкой обхода TLS
 */
async function maxApiRequest(method: string, path: string, body: any) {
    if (!MAX_BOT_TOKEN) return { success: false, error: 'Token missing' };

    const postData = JSON.stringify(body);

    const options = {
        hostname: MAX_API_BASE,
        port: 443,
        path: path,
        method: method,
        rejectUnauthorized: false, // ВАЖНО: игнорируем отсутствие сертификата Минцифры в Node.js
        headers: {
            'Content-Type': 'application/json',
            'Authorization': MAX_BOT_TOKEN,
            'Content-Length': Buffer.byteLength(postData),
        },
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => (responseBody += chunk));
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseBody);
                    resolve({ success: res.statusCode === 200, data: parsed });
                } catch (e) {
                    resolve({ success: false, error: 'Invalid JSON response' });
                }
            });
        });

        req.on('error', (e) => {
            console.error('[MAX API Request Error]:', e);
            resolve({ success: false, error: e.message });
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Отправляет текстовое сообщение
 */
export async function sendMaxMessage(chatId: string | number, text: string) {
    const result: any = await maxApiRequest('POST', '/messages', {
        chat_id: chatId,
        text,
    });
    return result.success;
}

/**
 * Регистрирует Webhook
 */
export async function registerMaxWebhook(webhookUrl: string) {
    return await maxApiRequest('POST', '/subscriptions', {
        url: webhookUrl,
        update_types: ['message_created', 'bot_started'],
    });
}