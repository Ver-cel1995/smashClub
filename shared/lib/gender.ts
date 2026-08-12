import type { Database } from '@/types/database'

export type Gender = Database['public']['Enums']['gender_type']
export type BadmintonCategory = Database['public']['Enums']['badminton_category']

export const GENDER_LABEL: Record<Gender, string> = {
    male: 'Мужской',
    female: 'Женский',
}

export const GENDER_LABEL_SHORT: Record<Gender, string> = {
    male: 'М',
    female: 'Ж',
}

/**
 * MS — только male, WS — только female, MD — только male, WD — только female, XD — оба.
 */
export function canPlayerJoinCategory(
    gender: Gender | null,
    category: BadmintonCategory
): boolean {
    if (!gender) return false  // без пола не пускаем в категории с полом
    if (category === 'MS' || category === 'MD') return gender === 'male'
    if (category === 'WS' || category === 'WD') return gender === 'female'
    if (category === 'XD') return true
    return false
}

/**
 * MD/WD — того же пола, XD — противоположного, MS/WS — партнёр не нужен.
 */
export function getRequiredPartnerGender(
    myGender: Gender | null,
    category: BadmintonCategory
): Gender | null {
    if (!myGender) return null
    if (category === 'MD') return 'male'
    if (category === 'WD') return 'female'
    if (category === 'XD') return myGender === 'male' ? 'female' : 'male'
    return null  // одиночные категории — партнёр не нужен
}

/**
 * Явно указать, что этой категории «пол не важен» (для одиночных).
 */
export function isPairCategory(category: BadmintonCategory): boolean {
    return category === 'MD' || category === 'WD' || category === 'XD'
}