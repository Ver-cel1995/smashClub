import type { RepairRacket, RacketStatus, RepairType } from '@/types'

export const ACTIVE_RACKET_STATUSES: RacketStatus[] = [
    'collecting',
    'sent_to_rostov',
    'in_repair',
    'ready',
]

export const RACKET_STATUS_LABEL: Record<RacketStatus, string> = {
    collecting: 'Собираем',
    sent_to_rostov: 'Отправлено в Ростов',
    in_repair: 'В ремонте',
    ready: 'Готово к получению',
    returned: 'Возвращено',
}

export const REPAIR_TYPE_LABEL: Record<RepairType, string> = {
    repair: 'Ремонт',
    restring: 'Натяжка',
}

/**
 * "Ремонт" / "Натяжка" / "Ремонт + натяжка"
 */
export function getRepairTypesLabel(
    rackets: Pick<RepairRacket, 'repair_type'>[]
): string {
    const types = new Set(rackets.map((r) => r.repair_type))
    const hasRepair = types.has('repair')
    const hasRestring = types.has('restring')

    if (hasRepair && hasRestring) return 'Ремонт + натяжка'
    if (hasRepair) return 'Ремонт'
    if (hasRestring) return 'Натяжка'
    return ''
}

export function getRacketStatusLabel(status: RacketStatus | string | null | undefined): string {
    if (!status) return '—'
    return RACKET_STATUS_LABEL[status as RacketStatus] ?? status
}