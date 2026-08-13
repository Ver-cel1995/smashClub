import type { TourStep } from '../driver'
import { waitForElement, sleep } from '../driver'

export type GeneralPlayerTourOptions = {
    /** Router для программной навигации */
    navigate: (path: string) => void
    /** Имя юзера для приветствия (первое слово из full_name) */
    userName: string
    /** Куда вернуть юзера после тура (обычно /home для автозапуска, /profile/settings/help для ручного) */
    returnPath: string
}

/**
 * Обзорный тур для игроков.
 *
 * Логика:
 *   - Всё автоматическое: юзер только читает и жмёт "Далее"
 *   - Некоторые шаги делают автоклик по элементу с хинтом "Сейчас кликну сюда"
 *   - После клика происходит навигация или открытие модалки, и мы переходим к следующему шагу
 *   - В конце возвращаем юзера в место запуска (или на /home при первом входе)
 */
export function buildGeneralPlayerTourSteps(
    options: GeneralPlayerTourOptions
): TourStep[] {
    const { navigate, userName, returnPath } = options

    return [
        // ============ 1. Приветствие ============
        {
            title: `👋 Привет, ${userName}!`,
            description:
                'Это SmashClub — приложение нашего клуба. Пройдём короткую экскурсию, займёт минуту. Инструкцию всегда можно вызвать снова в <b>Настройки → Помощь</b>.',
            onBeforeHighlight: async () => {
                navigate('/home')
                await waitForElement('[data-tour="home-main"]', 3000)
                await sleep(400)
            },
        },

        // ============ 2. Header ============
        {
            element: '[data-tour="app-header"]',
            title: '🎯 Твоя шапка',
            description:
                'Тут твоя аватарка и роль в клубе. Справа — список людей клуба и уведомления.',
            side: 'bottom',
            align: 'center',
        },

        // ============ 3. Главная — обзор ============
        {
            element: '[data-tour="home-main"]',
            title: '🏠 Главная',
            description:
                'Сюда собрано всё важное на сегодня: свежие новости, ближайшая тренировка, турниры, поездки.',
            side: 'top',
            onBeforeHighlight: async () => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
                await sleep(300)
            },
        },

        // ============ 4. Закреплённые новости ============
        {
            element: '[data-tour="home-pinned-post"]',
            title: '📌 Свежие новости',
            description:
                'Тут закреплённые посты и объявления от тренера. Не пропусти важное!',
            side: 'bottom',
        },

        // ============ 5. Ближайшая тренировка (просто показываем) ============
        {
            element: '[data-tour="home-next-training"]',
            title: '🏸 Ближайшая тренировка',
            description:
                'Твой следующий выход в зал. Кнопки <b>«Приду»</b> и <b>«Не приду»</b> прямо тут — один клик, и все игроки знают, кто будет.',
            side: 'bottom',
            onBeforeHighlight: async () => {
                await waitForElement('[data-tour="home-next-training"]', 2000)
                const el = document.querySelector('[data-tour="home-next-training"]')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                await sleep(400)
            },
        },

        // ============ 6. Автоклик по карточке тренировки → страница тренировки ============
        {
            element: '[data-tour="home-next-training"]',
            title: '👆 Что внутри тренировки?',
            description:
                'Если ткнуть по карточке — откроется страница тренировки с деталями.',
            side: 'bottom',
            autoClick: true,
            autoClickDelay: 2000,
        },

        // ============ 7. Attendance list на странице тренировки ============
        {
            element: '[data-tour="training-attendance-list"]',
            title: '👥 Кто придёт и комментарии',
            description:
                'Тут видно всех кто придёт, а кто нет. Также можно оставлять комментарии и обсуждать детали тренировки.',
            side: 'top',
            onBeforeHighlight: async () => {
                await waitForElement('[data-tour="training-attendance-list"]', 5000)
                await sleep(400)
            },
        },

        // ============ 8. Возвращаемся на главную ============
        {
            element: '[data-tour="home-next-tournament"]',
            title: '🏆 Ближайший турнир',
            description:
                'Клик по карточке турнира — детали, регистрация, выбор партнёра и приглашения в пару.',
            side: 'bottom',
            onBeforeHighlight: async () => {
                navigate('/home')
                await waitForElement('[data-tour="home-next-tournament"]', 3000)
                const el = document.querySelector('[data-tour="home-next-tournament"]')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                await sleep(400)
            },
        },

        // ============ 9. Bottom nav ============
        {
            element: '[data-tour="bottom-nav"]',
            title: '🧭 Навигация',
            description:
                'Внизу — главные разделы: <b>Дом</b>, <b>Лента</b>, <b>Турниры</b>, <b>Расписание</b>, <b>Профиль</b>. Тыкай для переключения.',
            side: 'top',
        },

        // ============ 10. Быстрый обзор ленты ============
        {
            element: '[data-tour="feed-list"]',
            title: '📰 Лента',
            description:
                'Здесь все новости, опросы, обсуждения. Ставь реакции, комментируй, смотри фотографии в галерее.',
            side: 'top',
            onBeforeHighlight: async () => {
                navigate('/feed')
                await waitForElement('[data-tour="feed-list"]', 3000)
                window.scrollTo({ top: 0, behavior: 'smooth' })
                await sleep(400)
            },
        },

        // ============ 11. Расписание ============
        {
            element: '[data-tour="schedule-calendar"]',
            title: '📅 Расписание',
            description:
                'Календарь всех тренировок. Точки под датами — типы тренировок. Легенда снизу.',
            side: 'top',
            onBeforeHighlight: async () => {
                navigate('/schedule')
                await waitForElement('[data-tour="schedule-calendar"]', 3000)
                await sleep(400)
            },
        },

        // ============ 12. Профиль ============
        {
            element: '[data-tour="profile-main"]',
            title: '👤 Профиль',
            description:
                'Твои настройки, ракетки, статистика, тема приложения. Тут же — раздел <b>Помощь</b>, где можно снова запустить эту экскурсию.',
            side: 'top',
            onBeforeHighlight: async () => {
                navigate('/profile')
                await waitForElement('[data-tour="profile-main"]', 3000)
                await sleep(400)
            },
        },

        // ============ 13. Финиш ============
        {
            title: '🏸 Приятной игры!',
            description:
                'Экскурсия закончена! Если что-то забыл — заходи в <b>Профиль → Настройки → Помощь</b> и запускай заново.',
            onBeforeHighlight: async () => {
                navigate(returnPath)
                await sleep(400)
            },
        },
    ]
}