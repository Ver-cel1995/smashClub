import type { InteractiveStep } from '../driver'
import { sleep } from '../driver'

export type CoachManagementTourOptions = {
    returnPath: string
}

/**
 * Тур «Управление контентом» для тренера.
 *
 * Показывает:
 * - Меню поста (три точки: редактировать/закрепить/удалить)
 * - Переход на пост
 * - Удаление комментария (только показываем, реально не удаляем)
 */
export function buildCoachManagementTourSteps(
    options: CoachManagementTourOptions
): InteractiveStep[] {
    const { returnPath } = options

    return [
        // ============ 1. Приветствие ============
        {
            kind: 'info',
            title: '🎨 Управление контентом',
            description:
                'Научимся <b>модерировать посты</b> и <b>управлять комментариями</b>. Как тренер, ты можешь править, закреплять, удалять — всё в одном месте.',
        },

        // ============ 2. Перейти в ленту ============
        {
            kind: 'navigate',
            to: '/feed',
            waitFor: '[data-tour="feed-list"]',
        },

        // ============ 3. Меню поста — три точки ============
        {
            kind: 'wait-click',
            element: '[data-tour="post-menu"]',
            title: '⋮ Меню поста',
            description:
                'На каждом посте в правом верхнем углу — <b>три точки</b>. Найди её и тыкни.',
            side: 'left',
            waitForNext: '[role="menuitem"]',
            waitTimeoutMs: 3000,
            onBefore: async () => {
                // Скроллим к первому посту
                const menu = document.querySelector('[data-tour="post-menu"]')
                if (menu) {
                    menu.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    await sleep(400)
                }
            },
        },

        // ============ 4. Обзор dropdown ============
        {
            kind: 'info',
            title: '🛠 Что тут можно',
            description:
                'Открылось меню. Три действия:<br/>• <b>Закрепить</b> — пост поднимется на верх ленты как объявление<br/>• <b>Удалить</b> — навсегда убрать пост<br/><br/>Меню появляется только у тебя (тренера). Игроки его не видят.',
            nextText: 'Понятно →',
        },

        // ============ 5. Закрыть dropdown ============
        {
            kind: 'info',
            title: '👇 Закрой меню',
            description:
                'Тыкни куда-нибудь вне меню (например, на текст поста), чтобы закрыть его. Потом переходим дальше.',
            nextText: 'Готово →',
        },

        // ============ 6. Клик на пост → переход ============
        {
            kind: 'wait-click',
            element: '[data-tour="feed-list"] article:first-of-type, [data-tour="feed-list"] > div:first-of-type',
            title: '👆 Открой пост',
            description:
                'Тыкни по любому посту (не по кнопкам, а по самому тексту), чтобы перейти на его страницу.',
            side: 'top',
            waitForNext: 'main',
            waitTimeoutMs: 5000,
        },

        // ============ 7. Обзор страницы поста ============
        {
            kind: 'info',
            title: '💬 Страница поста',
            description:
                'На странице поста ты видишь все комментарии. Как тренер, ты можешь <b>удалить любой комментарий</b> — рядом с каждым есть значок 🗑.<br/><br/>Также можно <b>отвечать</b> другим пользователям на их комментарии.',
            nextText: 'Понятно →',
        },

        // ============ 8. Финиш ============
        {
            kind: 'navigate',
            to: returnPath,
        },
        {
            kind: 'info',
            title: '🎉 Готово!',
            description:
                'Теперь ты умеешь модерировать посты и комментарии. Кстати, <b>неактуальные автопосты</b> (типа «Тренировка отменена») удаляются автоматически после того как день прошёл. <b>Опросы</b> — через 14 дней.',
            nextText: 'Закрыть ✓',
        },
    ]
}