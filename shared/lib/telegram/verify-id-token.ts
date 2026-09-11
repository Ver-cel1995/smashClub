import * as crypto from 'crypto'

export type TelegramJwtPayload = {
    sub: string
    iss: string
    aud: string
    iat: number
    exp: number
    id?: number
    name?: string
    given_name?: string
    family_name?: string
    preferred_username?: string
    picture?: string
}

function b64decode(str: string) {
    const pad = '='.repeat((4 - (str.length % 4)) % 4)
    const base64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/')
    return Buffer.from(base64, 'base64').toString('utf8')
}

/**
 * Проверка подлинности OIDC JWT токена Telegram
 */
export async function verifyTelegramIdToken(
    idToken: string,
    expectedClientId: string
): Promise<{ ok: true; payload: TelegramJwtPayload } | { ok: false; error: string }> {
    try {
        const parts = idToken.split('.')
        if (parts.length !== 3) {
            return { ok: false, error: 'Некорректный формат токена' }
        }

        const payload = JSON.parse(b64decode(parts[1])) as TelegramJwtPayload

        // 1. Проверяем эмитента
        if (payload.iss !== 'https://oauth.telegram.org') {
            return { ok: false, error: 'Неверный источник токена' }
        }

        // 2. Проверяем, что токен выпущен для нашего Client ID
        if (String(payload.aud) !== String(expectedClientId)) {
            return { ok: false, error: 'Токен выпущен для другого приложения' }
        }

        // 3. Проверяем срок годности
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < now) {
            return { ok: false, error: 'Срок действия токена истёк' }
        }

        return { ok: true, payload }
    } catch (err) {
        console.error('[verifyTelegramIdToken]', err)
        return { ok: false, error: 'Ошибка расшифровки токена' }
    }
}