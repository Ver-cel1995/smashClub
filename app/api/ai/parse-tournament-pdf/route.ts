import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { parseTournamentPdf } from '@/shared/lib/ai/parse-tournament-pdf'

export async function POST(req: NextRequest) {
    // 1. Проверка секрета
    const secret = req.headers.get('x-proxy-secret')
    if (!secret || secret !== process.env.AI_PROXY_SECRET) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        )
    }

    // 2. Проверка авторизации Supabase
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json(
            { success: false, error: 'Not authenticated' },
            { status: 401 }
        )
    }

    // 3. Проверка что тренер
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'coach') {
        return NextResponse.json(
            { success: false, error: 'Forbidden' },
            { status: 403 }
        )
    }

    // 4. Получаем storagePath из body
    const body = await req.json().catch(() => null)
    const storagePath = body?.storagePath as string | undefined
    if (!storagePath || typeof storagePath !== 'string') {
        return NextResponse.json(
            { success: false, error: 'Bad request: storagePath required' },
            { status: 400 }
        )
    }

    // 5. Скачиваем PDF из Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
        .from('tournament-pdfs')
        .download(storagePath)

    if (downloadError || !fileData) {
        console.error('PDF download failed in proxy:', downloadError)
        return NextResponse.json(
            { success: false, error: 'Failed to download PDF' },
            { status: 500 }
        )
    }

    // 6. Парсим через Gemini
    try {
        const buffer = await fileData.arrayBuffer()
        const parsed = await parseTournamentPdf(new Uint8Array(buffer))
        return NextResponse.json({ success: true, data: parsed })
    } catch (err) {
        console.error('AI parsing failed in proxy:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        )
    }
}