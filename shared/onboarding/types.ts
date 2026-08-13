/**
 * Все идентификаторы туров.
 */
export type TourId =
    | 'general_player'      // Обзорный тур для игроков
    | 'coach_posts'         // Тренер: посты и опросы
    | 'coach_management'    // Тренер: управление контентом (модерация, комментарии)
    | 'coach_schedule'      // Тренер: расписание
    | 'coach_tournaments'   // Тренер: турниры + AI

/**
 * Статус тура.
 */
export type TourStatus = {
    completed_at: string | null
    skipped_at: string | null
    version: number
}

export type OnboardingProgress = {
    [K in TourId]?: TourStatus
}

/**
 * ПОДНИМАЙ ВЕРСИЮ когда меняешь шаги тура.
 * После этого юзер увидит его в меню «Помощь» как «Обновлён — рекомендуем пройти».
 */
export const TOUR_VERSIONS: Record<TourId, number> = {
    general_player: 1,
    coach_posts: 1,
    coach_management: 1,
    coach_schedule: 1,
    coach_tournaments: 1,
}

export const TOUR_LABEL: Record<TourId, string> = {
    general_player: 'Общая экскурсия',
    coach_posts: 'Посты и опросы',
    coach_management: 'Управление контентом',
    coach_schedule: 'Расписание',
    coach_tournaments: 'Турниры и AI (искусственный интеллект)',
}

export const TOUR_DESCRIPTION: Record<TourId, string> = {
    general_player: 'Быстрое знакомство с приложением: главная, лента, расписание, профиль',
    coach_posts: 'Как создавать посты и опросы для игроков',
    coach_management: 'Модерация постов и комментариев',
    coach_schedule: 'Календарь, изменение периода, редактирование дня',
    coach_tournaments: 'Создание турниров с помощью AI (загрузка PDF)',
}

/**
 * Проверяет нужно ли показать тур автоматически.
 */
export function shouldShowTour(
    tourId: TourId,
    progress: OnboardingProgress | null
): boolean {
    if (!progress) return true
    const status = progress[tourId]
    if (!status) return true
    if (status.completed_at || status.skipped_at) return false
    return true
}

/**
 * Список туров, которые автозапускаются для роли.
 * Игрок — только общий обзорный.
 * Тренер — 4 практических тура (без общего игрового).
 */
export function getAutoLaunchTours(isCoach: boolean): TourId[] {
    if (isCoach) {
        return ['coach_posts', 'coach_management', 'coach_schedule', 'coach_tournaments']
    }
    return ['general_player']
}

/**
 * Список туров, доступных в меню «Помощь».
 * Игрок видит только свой; тренер видит все 4 своих (без игрового).
 */
export function getMenuTours(isCoach: boolean): TourId[] {
    if (isCoach) {
        return ['coach_posts', 'coach_management', 'coach_schedule', 'coach_tournaments']
    }
    return ['general_player']
}