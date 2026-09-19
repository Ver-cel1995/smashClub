'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/shared/lib/supabase/server'
import { getCurrentUser } from '@/shared/lib/auth'
import type { ActionResult } from '@/shared/lib/actions/types'
import { canPlayerJoinCategory, isPairCategory, type Gender } from '@/shared/lib/gender'

export type PlayerSearchResult = {
    id: string
    full_name: string
    avatar_url: string | null
    role: string
    gender: Gender | null
}

export type PartnerChoicePayload =
    | { kind: 'player'; player_id: string; full_name: string }
    | { kind: 'guest'; full_name: string }
    | { kind: 'join'; record_id: string }
    | null

export type RegistrationSlot = {
    category_id: string
    partner: PartnerChoicePayload
}

export type RegisterInput = {
    tournament_id: string
    slots: RegistrationSlot[]
}

function revalidateTournament(tournamentId: string) {
    revalidatePath(`/tournaments/${tournamentId}`)
    revalidatePath('/tournaments')
    revalidatePath('/home')
}

/**
 * Поиск игроков клуба для выбора партнёра.
 */
export async function searchPlayers(
    query: string,
    requiredGender: Gender | null = null
): Promise<ActionResult<PlayerSearchResult[]>> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Нужно войти в аккаунт' }

    const trimmed = query.trim()
    if (trimmed.length < 2) return { success: true, data: [] }

    const supabase = await createClient()

    let q = supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, gender')
        .ilike('full_name', `%${trimmed}%`)
        .neq('id', user.id)
        .limit(10)

    if (requiredGender) {
        q = q.eq('gender', requiredGender)
    }

    const { data, error } = await q

    if (error) {
        console.error('[searchPlayers]', error)
        return { success: false, error: 'Не удалось выполнить поиск' }
    }

    return { success: true, data: (data ?? []) as PlayerSearchResult[] }
}

/**
 * Регистрация в одну или несколько категорий турнира.
 */
export async function registerForTournament(
    input: RegisterInput
): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Нужно войти в аккаунт' }

    const supabase = await createClient()
    const { tournament_id, slots } = input

    if (!slots.length) {
        return { success: false, error: 'Не выбрана ни одна категория' }
    }

    // Одна и та же категория не должна попасть в запрос дважды
    const uniqueSlots = slots.filter(
        (slot, i) =>
            slots.findIndex(
                (s) =>
                    s.category_id === slot.category_id &&
                    s.partner?.kind === slot.partner?.kind
            ) === i
    )

    const categoryIds = uniqueSlots.map((s) => s.category_id)

    // Категории турнира: проверяем принадлежность и парность одним запросом
    const { data: categories, error: categoriesError } = await supabase
        .from('tournament_categories')
        .select('id, category, tournament_id, max_pairs')
        .in('id', categoryIds)

    if (categoriesError) {
        console.error('[registerForTournament:categories]', categoriesError)
        return { success: false, error: 'Не удалось проверить категории' }
    }

    const categoryMap = new Map((categories ?? []).map((c) => [c.id, c]))

    for (const slot of uniqueSlots) {
        const category = categoryMap.get(slot.category_id)
        if (!category || category.tournament_id !== tournament_id) {
            return { success: false, error: 'Категория не относится к этому турниру' }
        }
        if (!canPlayerJoinCategory(user.profile.gender, category.category)) {
            return {
                success: false,
                error: `Категория ${category.category} недоступна для вашего пола`,
            }
        }
    }

    // Существующие заявки игрока по всем выбранным категориям — одним запросом.
    // maybeSingle() тут падал с ошибкой, если строк было больше одной.
    const { data: existingRows } = await supabase
        .from('tournament_participants')
        .select('id, category_id')
        .in('category_id', categoryIds)
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .neq('status', 'withdrawn')

    const busyCategories = new Set((existingRows ?? []).map((r) => r.category_id))

    const registered: string[] = []
    const skipped: string[] = []

    for (const slot of uniqueSlots) {
        const category = categoryMap.get(slot.category_id)!
        const label = category.category

        // Присоединение к чужой заявке «ищу пару»
        if (slot.partner?.kind === 'join') {
            if (busyCategories.has(slot.category_id)) {
                skipped.push(label)
                continue
            }

            const { data: joined, error } = await supabase
                .from('tournament_participants')
                .update({ player2_id: user.id, pair_status: 'confirmed' })
                .eq('id', slot.partner.record_id)
                .is('player2_id', null)
                .is('guest2_id', null)
                .select('id')

            if (error) {
                console.error('[registerForTournament:join]', error)
                return { success: false, error: 'Не удалось присоединиться к паре' }
            }
            if (!joined || joined.length === 0) {
                return { success: false, error: 'Эту пару уже занял другой игрок' }
            }

            registered.push(label)
            continue
        }

        if (busyCategories.has(slot.category_id)) {
            skipped.push(label)
            continue
        }

        const isPair = isPairCategory(category.category)

        let guest2Id: string | null = null
        let player2Id: string | null = null
        let pairStatus: 'pending' | 'confirmed' | null = null

        // Партнёр учитывается только в парных категориях
        if (isPair && slot.partner?.kind === 'player') {
            if (slot.partner.player_id === user.id) {
                return { success: false, error: 'Нельзя выбрать себя партнёром' }
            }
            player2Id = slot.partner.player_id
            pairStatus = 'pending'
        } else if (isPair && slot.partner?.kind === 'guest') {
            const guestName = slot.partner.full_name.trim()
            if (guestName.length < 2) {
                return { success: false, error: 'Укажите имя гостя' }
            }

            const { data: guest, error: guestError } = await supabase
                .from('guests')
                .insert({ full_name: guestName, created_by: user.id })
                .select('id')
                .single()

            if (guestError || !guest) {
                console.error('[registerForTournament:guest]', guestError)
                return { success: false, error: 'Не удалось добавить гостя' }
            }
            guest2Id = guest.id
            pairStatus = 'confirmed'
        }

        const { error } = await supabase.from('tournament_participants').insert({
            tournament_id,
            category_id: slot.category_id,
            player1_id: user.id,
            player2_id: player2Id,
            guest2_id: guest2Id,
            pair_status: pairStatus,
            status: 'registered',
            registered_by: user.id,
        })

        if (error) {
            console.error('[registerForTournament:insert]', error)
            // гостя, созданного под неудавшуюся заявку, не оставляем висеть
            if (guest2Id) await supabase.from('guests').delete().eq('id', guest2Id)

            if (error.code === '23505') {
                skipped.push(label)
                continue
            }
            return { success: false, error: 'Не удалось зарегистрироваться' }
        }

        registered.push(label)
    }

    if (registered.length === 0) {
        return {
            success: false,
            error: skipped.length
                ? `Вы уже записаны: ${[...new Set(skipped)].join(', ')}`
                : 'Не удалось зарегистрироваться',
        }
    }

    revalidateTournament(tournament_id)
    return { success: true }
}

/**
 * Отмена своей заявки (я — player1).
 */
export async function cancelRegistration(recordId: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Нужно войти в аккаунт' }

    const supabase = await createClient()

    const { data: record } = await supabase
        .from('tournament_participants')
        .select('tournament_id, player1_id')
        .eq('id', recordId)
        .maybeSingle()

    if (!record) return { success: false, error: 'Заявка не найдена' }

    const isCoach = user.profile.role === 'coach' || user.profile.role === 'development'
    if (record.player1_id !== user.id && !isCoach) {
        return { success: false, error: 'Можно отменить только свою заявку' }
    }

    const { error } = await supabase
        .from('tournament_participants')
        .delete()
        .eq('id', recordId)

    if (error) {
        console.error('[cancelRegistration]', error)
        return { success: false, error: 'Не удалось отменить заявку' }
    }

    revalidateTournament(record.tournament_id)
    return { success: true }
}

/**
 * Выйти из пары, когда я — второй игрок (player2).
 */
export async function leavePairAsPartner(recordId: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Нужно войти в аккаунт' }

    const supabase = await createClient()

    const { data: record } = await supabase
        .from('tournament_participants')
        .select('tournament_id, player2_id')
        .eq('id', recordId)
        .maybeSingle()

    if (!record) return { success: false, error: 'Заявка не найдена' }
    if (record.player2_id !== user.id) {
        return { success: false, error: 'Ты не состоишь в этой паре' }
    }

    const { error } = await supabase
        .from('tournament_participants')
        .update({ player2_id: null, pair_status: null })
        .eq('id', recordId)

    if (error) {
        console.error('[leavePairAsPartner]', error)
        return { success: false, error: 'Не удалось выйти из пары' }
    }

    revalidateTournament(record.tournament_id)
    return { success: true }
}

/**
 * Убрать партнёра из своей заявки (я — player1).
 */
export async function removePartner(recordId: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Нужно войти в аккаунт' }

    const supabase = await createClient()

    const { data: record } = await supabase
        .from('tournament_participants')
        .select('tournament_id, player1_id, guest2_id')
        .eq('id', recordId)
        .maybeSingle()

    if (!record) return { success: false, error: 'Заявка не найдена' }

    const isCoach = user.profile.role === 'coach' || user.profile.role === 'development'
    if (record.player1_id !== user.id && !isCoach) {
        return { success: false, error: 'Нет прав на изменение заявки' }
    }

    const { error } = await supabase
        .from('tournament_participants')
        .update({ player2_id: null, guest2_id: null, pair_status: null })
        .eq('id', recordId)

    if (error) {
        console.error('[removePartner]', error)
        return { success: false, error: 'Не удалось убрать партнёра' }
    }

    if (record.guest2_id) {
        await supabase.from('guests').delete().eq('id', record.guest2_id)
    }

    revalidateTournament(record.tournament_id)
    return { success: true }
}

/**
 * Ответ на приглашение в пару.
 */
export async function respondToPairInvite(
    recordId: string,
    response: 'confirm' | 'decline'
): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Нужно войти в аккаунт' }

    const supabase = await createClient()

    const { data: record } = await supabase
        .from('tournament_participants')
        .select('tournament_id, player2_id, pair_status')
        .eq('id', recordId)
        .maybeSingle()

    if (!record) return { success: false, error: 'Приглашение не найдено' }
    if (record.player2_id !== user.id) {
        return { success: false, error: 'Это приглашение не для тебя' }
    }

    const { error } =
        response === 'confirm'
            ? await supabase
                .from('tournament_participants')
                .update({ pair_status: 'confirmed' })
                .eq('id', recordId)
            : await supabase
                .from('tournament_participants')
                .update({ player2_id: null, pair_status: null })
                .eq('id', recordId)

    if (error) {
        console.error('[respondToPairInvite]', error)
        return { success: false, error: 'Не удалось обработать приглашение' }
    }

    revalidateTournament(record.tournament_id)
    return { success: true }
}