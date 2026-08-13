import type { InteractiveStep } from '../driver'

export type CoachPostsTourOptions = {
    returnPath: string
}

/**
 * Тур «Посты и опросы» для тренера.
 * Сначала переводим на ленту, потом учимся FAB → Пост → Опросник.
 */
export function buildCoachPostsTourSteps(
    options: CoachPostsTourOptions
): InteractiveStep[] {
    const { returnPath } = options

    return [
        // ============ 1. Приветствие ============
        {
            kind: 'info',
            title: '✏️ Посты и опросы',
            description:
                'Научимся создавать <b>посты</b> и <b>опросы</b> для игроков. Тыкай сама — я подскажу что делать на каждом шаге.',
        },

        // ============ 2. Переход в ленту (авто) ============
        {
            kind: 'navigate',
            to: '/feed',
            waitFor: '[data-tour="feed-create-fab"]',
        },

        // ============ 3. Клик на FAB ============
        {
            kind: 'wait-click',
            element: '[data-tour="feed-create-fab"]',
            title: '➕ Кнопка создания',
            description:
                'Мы в разделе <b>«Лента»</b>. ' +
                'Круглая кнопка справа снизу — это кнопка создания. ' +
                'Тыкни по ней — появятся варианты: <b>Пост</b> и <b>Опросник</b>.',
            side: 'left',
            waitForNext: '[data-tour="feed-fab-post"]',
        },

        // ============ 4. Клик на "Пост" ============
        {
            kind: 'wait-click',
            element: '[data-tour="feed-fab-post"]',
            title: '📄 Выбери «Пост»',
            description: 'Тыкни на вариант <b>«Пост»</b> — откроется форма создания.',
            side: 'left',
            waitForNext: 'form',
            waitTimeoutMs: 8000,
        },

        // ============ 5. Обзор формы поста ============
        {
            kind: 'info',
            title: '📝 Форма поста',
            description:
                'Тут заполняешь: <b>заголовок</b> (необязательно), <b>текст</b>, можно добавить <b>фото или документ</b>. Внизу тумблер <b>«Закрепить»</b> — пост поднимется на главную как объявление.',
            nextText: 'Понятно →',
        },

        // ============ 6. Возврат в ленту (авто) ============
        {
            kind: 'info',
            title: '↩️ Вернёмся к опросу',
            description:
                'Сейчас вернёмся в ленту и посмотрим как создавать <b>опрос</b>. Пост пока не публикуем — просто учимся.',
            nextText: 'Вернуться →',
        },
        {
            kind: 'navigate',
            to: '/feed',
            waitFor: '[data-tour="feed-create-fab"]',
        },

        // ============ 7. Снова FAB → опросник ============
        {
            kind: 'wait-click',
            element: '[data-tour="feed-create-fab"]',
            title: '➕ Открой меню снова',
            description: 'Тыкни на плюс ещё раз.',
            side: 'left',
            waitForNext: '[data-tour="feed-fab-poll"]',
        },
        {
            kind: 'wait-click',
            element: '[data-tour="feed-fab-poll"]',
            title: '📊 Выбери «Опросник»',
            description: 'Тыкни на <b>«Опросник»</b> — откроется форма опроса.',
            side: 'left',
            waitForNext: 'form',
            waitTimeoutMs: 8000,
        },

        // ============ 8. Обзор формы опроса ============
        {
            kind: 'info',
            title: '🗳 Форма опроса',
            description:
                'Тут: <b>вопрос</b>, <b>варианты ответа</b> (минимум 2, максимум 10). Кнопка <b>«+ Добавить вариант»</b> добавляет ещё поле. Тумблер <b>«Множественный выбор»</b> — игроки смогут выбрать несколько ответов одновременно.',
            nextText: 'Понятно →',
        },

        // ============ 9. Финиш ============
        {
            kind: 'navigate',
            to: returnPath,
        },
        {
            kind: 'info',
            title: '🎉 Готово!',
            description:
                'Теперь ты умеешь создавать посты и опросы. Всегда можно вернуться в <b>Настройки → Помощь</b> и повторить эту экскурсию.',
            nextText: 'Закрыть ✓',
        },
    ]
}