'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/shared/lib/supabase/server'
import { getCurrentUser } from '@/shared/lib/auth'
import type { ActionResult } from '@/shared/lib/actions/types'

const RacketItemSchema = z.object({
    racket_model: z.string().min(1, 'Укажите модель').max(100),
    needs_repair: z.boolean(),
    needs_restring: z.boolean(),
    string_type: z.string().max(100).optional().nullable(),
    tension: z.string().max(20).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
})

const CreateRacketRequestSchema = z.object({
    items: z.array(RacketItemSchema).min(1, 'Добавьте хотя бы одну ракетку'),
})

/** Примерные цены — потом настроишь */
const PRICE_REPAIR = 500
const PRICE_RESTRING = 350

export async function createRacketRequest(
    formData: FormData
): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Не авторизован' }

    // Достаём JSON из скрытого поля
    const raw = formData.get('items')
    if (!raw || typeof raw !== 'string') {
        return { success: false, error: 'Нет данных' }
    }

    let parsedRaw: unknown
    try {
        parsedRaw = JSON.parse(raw)
    } catch {
        return { success: false, error: 'Некорректные данные' }
    }

    const parsed = CreateRacketRequestSchema.safeParse({ items: parsedRaw })
    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues[0]?.message ?? 'Проверьте поля',
        }
    }

    const { items } = parsed.data
    if (!items.some((i) => i.needs_repair || i.needs_restring)) {
        return {
            success: false,
            error: 'Выберите хотя бы одно действие для каждой ракетки',
        }
    }

    const supabase = await createClient()

    // 1. Создаём batch
    const { data: batch, error: batchErr } = await supabase
        .from('repair_batches')
        .insert({
            created_by: user.userId,
            status: 'collecting',
            title: `Заявка ${user.profile.full_name}`,
        })
        .select('id')
        .single()

    if (batchErr || !batch) {
        console.error('[createRacketRequest] batch error:', batchErr)
        return { success: false, error: 'Не удалось создать заявку' }
    }

    // 2. Раскладываем items → repair_rackets
    // На каждую ракетку с обоими действиями создаём 2 записи
    const rows: any[] = []
    for (const item of items) {
        if (item.needs_repair) {
            rows.push({
                batch_id: batch.id,
                owner_id: user.userId,
                racket_model: item.racket_model,
                repair_type: 'repair',
                cost: PRICE_REPAIR,
                status: 'collecting',
                notes: item.notes || null,
            })
        }
        if (item.needs_restring) {
            rows.push({
                batch_id: batch.id,
                owner_id: user.userId,
                racket_model: item.racket_model,
                repair_type: 'restring',
                string_type: item.string_type || null,
                tension: item.tension || null,
                cost: PRICE_RESTRING,
                status: 'collecting',
                notes: item.notes || null,
            })
        }
    }

    const { error: rowsErr } = await supabase.from('repair_rackets').insert(rows)

    if (rowsErr) {
        console.error('[createRacketRequest] rows error:', rowsErr)
        return { success: false, error: 'Не удалось сохранить ракетки' }
    }

    revalidatePath('/profile')
    revalidatePath('/profile/rackets')
    revalidatePath('/home')

    return { success: true }
}