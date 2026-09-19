'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { getCurrentUser } from '@/shared/lib/auth'
import type { ActionResult } from '@/shared/lib/actions/types'
import { parseTournamentPdf, type ParsedTournament } from '@/shared/lib/ai/parse-tournament-pdf'

const BUCKET = 'tournament-pdfs'

export type UploadedPdf = { url: string; path: string }

export async function uploadTournamentPdf(
    formData: FormData
): Promise<ActionResult<UploadedPdf>> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Нужно войти в аккаунт' }

    const isCoach = user.profile.role === 'coach' || user.profile.role === 'development'
    if (!isCoach) return { success: false, error: 'Только тренер может загружать положение' }

    const file = formData.get('pdf')
    if (!(file instanceof File) || file.size === 0) {
        return { success: false, error: 'Файл не передан' }
    }
    if (file.type !== 'application/pdf') {
        return { success: false, error: 'Нужен PDF-файл' }
    }
    if (file.size > 10 * 1024 * 1024) {
        return { success: false, error: 'Файл больше 10 МБ' }
    }

    const supabase = await createClient()
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: 'application/pdf' })

    if (error) {
        console.error('[uploadTournamentPdf]', error)
        return { success: false, error: 'Не удалось загрузить файл' }
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

    return { success: true, data: { url: data.publicUrl, path } }
}

export async function parseTournamentPdfAction(
    path: string
): Promise<ActionResult<ParsedTournament>> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Нужно войти в аккаунт' }

    const supabase = await createClient()

    const { data: blob, error } = await supabase.storage.from(BUCKET).download(path)

    if (error || !blob) {
        console.error('[parseTournamentPdfAction:download]', error)
        return { success: false, error: 'Не удалось прочитать файл' }
    }

    try {
        const bytes = new Uint8Array(await blob.arrayBuffer())
        const parsed = await parseTournamentPdf(bytes)
        return { success: true, data: parsed }
    } catch (e) {
        console.error('[parseTournamentPdfAction:parse]', e)
        return { success: false, error: 'Не удалось распознать документ' }
    }
}

export async function deleteTournamentPdf(path: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Нужно войти в аккаунт' }

    const supabase = await createClient()
    const { error } = await supabase.storage.from(BUCKET).remove([path])

    if (error) {
        console.error('[deleteTournamentPdf]', error)
        return { success: false, error: 'Не удалось удалить файл' }
    }

    return { success: true }
}