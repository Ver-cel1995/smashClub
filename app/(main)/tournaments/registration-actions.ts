'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/shared/lib/supabase/server'
import { getCurrentUser } from '@/shared/lib/auth'
import type { ActionResult } from '@/shared/lib/actions/types'
import type { Gender } from '@/shared/lib/gender'

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

    for (const slot of slots) {
        // Присоединение к чужой заявке «ищу пару»
        if (slot.partner?.kind === 'join') {
            const { error } = await supabase
                .from('tournament_participants')
                .update({ player2_id: user.id, pair_status: 'confirmed' })
                .eq('id', slot.partner.record_id)
                .is('player2_id', null)
                .is('guest2_id', null)

            if (error) {
                console.error('[registerForTournament:join]', error)
                return { success: false, error: 'Не удалось присоединиться к паре' }
            }
            continue
        }

        // Проверка, что игрок ещё не записан в эту категорию
        const { data: existing } = await supabase
            .from('tournament_participants')
            .select('id')
            .eq('category_id', slot.category_id)
            .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
            .neq('status', 'withdrawn')
            .maybeSingle()

        if (existing) {
            return { success: false, error: 'Ты уже записан в одну из этих категорий' }
        }

        let guest2Id: string | null = null
        let player2Id: string | null = null
        let pairStatus: 'pending' | 'confirmed' | null = null

        if (slot.partner?.kind === 'player') {
            player2Id = slot.partner.player_id
            pairStatus = 'pending'
        } else if (slot.partner?.kind === 'guest') {
            const { data: guest, error: guestError } = await supabase
                .from('guests')
                .insert({ full_name: slot.partner.full_name, created_by: user.id })
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
            status: 'confirmed',
            registered_by: user.id,
        })

        if (error) {
            console.error('[registerForTournament:insert]', error)
            if (error.code === '23505') {
                return { success: false, error: 'Такая заявка уже существует' }
            }
            return { success: false, error: 'Не удалось зарегистрироваться' }
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