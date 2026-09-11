import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/shared/lib/supabase/admin'

// Можно вынести verifyTelegramLogin в shared/lib/telegram-auth.ts и импортировать
// Здесь упрощённо: на проде тот же flow, что в actions

async function sendTelegramMessage(chatId: number, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN!
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    })
}

export async function POST(req: NextRequest) {
    try {
        const update = await req.json()
        const message = update?.message
        if (!message?.text || !message.from) {
            return NextResponse.json({ ok: true })
        }

        const text = String(message.text).trim()
        if (!text.startsWith('/start')) {
            return NextResponse.json({ ok: true })
        }

        const code = text.split(/\s+/)[1]?.trim()
        const chatId = message.chat.id
        const tgUser = message.from

        if (!code) {
            await sendTelegramMessage(
                chatId,
                `👋 Открой вход из приложения SmashClub.`
            )
            return NextResponse.json({ ok: true })
        }

        // Лучше вынести verify в lib. Временно:
        const supabaseAdmin = createAdminClient()
        const { data: authCode } = await supabaseAdmin
            .from('auth_codes')
            .select('*')
            .eq('code', code)
            .eq('status', 'pending')
            .maybeSingle()

        if (!authCode) {
            await sendTelegramMessage(chatId, '⏰ Код недействителен. Запроси вход снова.')
            return NextResponse.json({ ok: true })
        }

        // Помечаем «обработано» — полная verify в drainTelegramUpdates / shared
        // Для продакшена скопируй verifyTelegramLogin в shared/lib/telegram-verify.ts
        await sendTelegramMessage(
            chatId,
            '✅ Запрос получен. Если вход не завершился — открой приложение ещё раз.'
        )

        return NextResponse.json({ ok: true })
    } catch (e) {
        console.error('[tg webhook]', e)
        return NextResponse.json({ ok: true })
    }
}