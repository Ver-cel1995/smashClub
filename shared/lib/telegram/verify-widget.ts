import crypto from 'crypto'

export type TelegramWidgetUser = {
    id: number
    first_name?: string
    last_name?: string
    username?: string
    photo_url?: string
    auth_date: number
    hash: string
}

/**
 * https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramWidgetAuth(
    data: Record<string, string>,
    botToken: string
): { ok: true; user: TelegramWidgetUser } | { ok: false; error: string } {
    const hash = data.hash
    if (!hash) return { ok: false, error: 'нет hash' }

    // 1) data-check-string: все поля кроме hash, sort, key=value через \n
    const checkString = Object.keys(data)
        .filter((k) => k !== 'hash')
        .sort()
        .map((k) => `${k}=${data[k]}`)
        .join('\n')

    // 2) secret_key = SHA256(bot_token)
    const secretKey = crypto.createHash('sha256').update(botToken).digest()

    // 3) HMAC-SHA256(checkString, secretKey) === hash
    const calculated = crypto
        .createHmac('sha256', secretKey)
        .update(checkString)
        .digest('hex')

    if (calculated !== hash) {
        return { ok: false, error: 'неверная подпись Telegram' }
    }

    const authDate = Number(data.auth_date)
    if (!authDate || Number.isNaN(authDate)) {
        return { ok: false, error: 'нет auth_date' }
    }

    // не старше 24 часов
    const ageSec = Math.floor(Date.now() / 1000) - authDate
    if (ageSec > 86400) {
        return { ok: false, error: 'данные устарели — войди снова' }
    }

    const id = Number(data.id)
    if (!id) return { ok: false, error: 'нет id' }

    return {
        ok: true,
        user: {
            id,
            first_name: data.first_name,
            last_name: data.last_name,
            username: data.username,
            photo_url: data.photo_url,
            auth_date: authDate,
            hash,
        },
    }
}