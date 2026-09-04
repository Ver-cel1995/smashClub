import { NextRequest, NextResponse } from 'next/server'
import { verifyTelegramLogin } from '@/app/(auth)/telegram-actions'

// Эмулятор Telegram для локальной разработки
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')

    if (!code) {
        return new NextResponse('Укажите ?code=XXXXXX в URL', { status: 400 })
    }

    // Эмулируем ответ от пользователя Telegram
    const fakeTgUser = {
        id: 77712345,
        first_name: 'Алексей (Dev)',
        username: 'alexey_dev',
    }

    const result = await verifyTelegramLogin(code, fakeTgUser)

    if (result.ok) {
        return new NextResponse(
            `<html>
        <body style="font-family: sans-serif; background: #0f131d; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; background: #171c2c; padding: 30px; border-radius: 20px; border: 1px solid #a3e635;">
            <h1 style="color: #a3e635; margin-0 0 10px;">✅ Вход успешно подтверждён!</h1>
            <p style="color: #8a94a6;">Вернитесь на вкладку приложения SmashClub — переход произойдёт автоматически.</p>
          </div>
        </body>
      </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
    }

    return new NextResponse(`Ошибка: ${result.error || 'Код не найден'}`, { status: 400 })
}