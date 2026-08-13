import { driver, type Config, type Driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import './styles.css'

// ============================================================
// Обзорный режим (existing)
// ============================================================

export type TourStep = {
    element?: string
    title: string
    description: string
    side?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
    onBeforeHighlight?: () => void | Promise<void>
    onHighlighted?: () => void | Promise<void>
    /**
     * Для обзорного тура: если true — при переходе к этому шагу автоматически
     * кликаем по подсвеченному элементу через 1.5s после показа.
     * В popover появляется хинт "Сейчас кликну сюда...".
     * (Требует element)
     */
    autoClick?: boolean
    /**
     * Задержка перед авто-кликом в мс. По умолчанию 1500.
     */
    autoClickDelay?: number
}

export type TourConfig = {
    steps: TourStep[]
    showProgress?: boolean
    nextBtnText?: string
    prevBtnText?: string
    doneBtnText?: string
    onComplete?: () => void | Promise<void>
    onSkip?: () => void | Promise<void>
}

export function startTour(config: TourConfig): Driver {
    let didComplete = false
    let autoClickTimer: ReturnType<typeof setTimeout> | null = null

    const clearAutoClick = () => {
        if (autoClickTimer) {
            clearTimeout(autoClickTimer)
            autoClickTimer = null
        }
    }

    const driveSteps: DriveStep[] = config.steps.map((step, index) => {
        const isLastStep = index === config.steps.length - 1
        // Модифицируем описание если есть autoClick
        const description = step.autoClick && step.element
            ? `${step.description}<div class="smashclub-interactive-hint">👆 Сейчас кликну сюда</div>`
            : step.description

        return {
            element: step.element,
            popover: {
                title: step.title,
                description,
                ...(step.side ? { side: step.side } : {}),
                ...(step.align ? { align: step.align } : {}),
                onNextClick: (_element, _stepDef, opts) => {
                    clearAutoClick()
                    if (isLastStep) {
                        didComplete = true
                        opts.driver.destroy()
                    } else {
                        opts.driver.moveNext()
                    }
                },
            },
            onHighlightStarted: async () => {
                clearAutoClick()
                if (step.onBeforeHighlight) {
                    await step.onBeforeHighlight()
                }
            },
            onHighlighted: async () => {
                if (step.onHighlighted) {
                    await step.onHighlighted()
                }
                // Auto-click: программно кликаем по элементу через задержку
                if (step.autoClick && step.element) {
                    const delay = step.autoClickDelay ?? 1500
                    autoClickTimer = setTimeout(() => {
                        const el = document.querySelector<HTMLElement>(step.element!)
                        if (el) {
                            el.click()
                        }
                    }, delay)
                }
            },
        }
    })

    const driverConfig: Config = {
        steps: driveSteps,
        showProgress: config.showProgress ?? true,
        progressText: '{{current}} из {{total}}',
        nextBtnText: config.nextBtnText ?? 'Далее →',
        prevBtnText: config.prevBtnText ?? '← Назад',
        doneBtnText: config.doneBtnText ?? 'Готово ✓',
        popoverClass: 'smashclub-popover',
        overlayColor: '#000',
        overlayOpacity: 0.65,
        allowClose: false,  // ← НЕ даём закрыть кликом вне
        smoothScroll: true,
        stagePadding: 6,
        stageRadius: 16,
        allowKeyboardControl: true,
        disableActiveInteraction: true,  // ← блокируем клики по подсвеченному элементу
        onDestroyStarted: (_element, _step, opts) => {
            clearAutoClick()
            if (!didComplete) {
                config.onSkip?.()
            } else {
                config.onComplete?.()
            }
            opts.driver.destroy()
        },
    }

    const driverInstance = driver(driverConfig)
    driverInstance.drive()

    return driverInstance
}

// ============================================================
// Интерактивный режим (для тренера)
// ============================================================

export type InteractiveStep =
    | InteractiveWaitClickStep
    | InteractiveInfoStep
    | InteractiveNavigateStep

/**
 * Шаг где ждём клик пользователя по подсвеченному элементу.
 */
export type InteractiveWaitClickStep = {
    kind: 'wait-click'
    element: string  // обязателен
    title: string
    description: string
    side?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
    /**
     * После клика — ждать появления следующего элемента (селектор).
     * Полезно когда клик открывает модалку/навигирует.
     */
    waitForNext?: string
    waitTimeoutMs?: number
    /** Колбэк перед показом шага (для скроллинга, навигации и т.п.) */
    onBefore?: () => void | Promise<void>
}

/**
 * Информационный шаг: просто popover с кнопкой "Далее".
 * Используем для приветствий, финалов, промежуточных объяснений.
 */
export type InteractiveInfoStep = {
    kind: 'info'
    element?: string  // опционально — если есть, подсвечиваем
    title: string
    description: string
    side?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
    onBefore?: () => void | Promise<void>
    /** Кастомный текст кнопки "Далее" */
    nextText?: string
}

/**
 * Программная навигация без взаимодействия юзера.
 * Автоматически переходит на страницу и ждёт элемент.
 */
export type InteractiveNavigateStep = {
    kind: 'navigate'
    to: string  // путь
    waitFor?: string  // селектор для ожидания после навигации
    waitTimeoutMs?: number
}

export type InteractiveTourConfig = {
    steps: InteractiveStep[]
    onComplete?: () => void | Promise<void>
    onSkip?: () => void | Promise<void>
    /** Router для навигации (передавать из хука) */
    router: {
        push: (path: string) => void
    }
}

/**
 * Запускает интерактивный тур для тренера.
 * Каждый шаг может ждать реального клика пользователя.
 */
export function startInteractiveTour(config: InteractiveTourConfig): Driver {
    let didComplete = false
    let clickListener: ((e: Event) => void) | null = null
    let currentTargetEl: HTMLElement | null = null

    const cleanupListener = () => {
        if (clickListener && currentTargetEl) {
            currentTargetEl.removeEventListener('click', clickListener, true)
        }
        clickListener = null
        currentTargetEl = null
    }

    const waitForElementInternal = async (selector: string, timeoutMs = 5000): Promise<Element | null> => {
        const start = Date.now()
        while (Date.now() - start < timeoutMs) {
            const el = document.querySelector(selector)
            if (el) return el
            await new Promise((r) => setTimeout(r, 50))
        }
        return null
    }

    // prepareSteps — сливаем navigate с последующими шагами
    type PreparedStep = (InteractiveWaitClickStep | InteractiveInfoStep) & {
        _navigateBefore?: InteractiveNavigateStep
    }

    const preparedSteps: PreparedStep[] = []
    for (let i = 0; i < config.steps.length; i++) {
        const s = config.steps[i]
        if (s.kind === 'navigate') {
            let nextIdx = i + 1
            while (nextIdx < config.steps.length && config.steps[nextIdx].kind === 'navigate') {
                nextIdx++
            }
            if (nextIdx < config.steps.length) {
                preparedSteps.push({
                    ...(config.steps[nextIdx] as InteractiveWaitClickStep | InteractiveInfoStep),
                    _navigateBefore: s,
                })
                i = nextIdx
            }
        } else {
            preparedSteps.push(s as PreparedStep)
        }
    }

    // Индекс текущего шага (управляем вручную)
    let currentStepIndex = 0
    let driverInstance: Driver | null = null

    const showStep = async (index: number) => {
        cleanupListener()

        if (index >= preparedSteps.length) {
            didComplete = true
            driverInstance?.destroy()
            return
        }

        const step = preparedSteps[index]
        const isLastStep = index === preparedSteps.length - 1
        const isInteractive = step.kind === 'wait-click'

        // 1. Если есть navigate — выполняем и ждём элемент
        const navStep = step._navigateBefore
        if (navStep) {
            config.router.push(navStep.to)
            if (navStep.waitFor) {
                await waitForElementInternal(navStep.waitFor, navStep.waitTimeoutMs ?? 5000)
            }
            // Небольшая задержка чтобы React успел отрендерить
            await new Promise((r) => setTimeout(r, 300))
        }

        // 2. Вызываем onBefore
        if (step.onBefore) {
            await step.onBefore()
        }

        // 3. Если у шага есть element — ждём его появления
        if (step.element) {
            await waitForElementInternal(step.element, 3000)
        }

        // 4. Готовим шаг для driver.js
        const description = isInteractive
            ? `${(step as InteractiveWaitClickStep).description}<div class="smashclub-interactive-hint">👆 Тыкни на подсвеченное</div>`
            : (step as InteractiveInfoStep).description

        const popoverClass = isInteractive
            ? 'smashclub-popover smashclub-popover-interactive'
            : 'smashclub-popover'

        const showButtons: Array<'next' | 'previous' | 'close'> = isInteractive
            ? ['close']
            : ['next', 'close']

        const driveStep: DriveStep = {
            element: step.element,
            popover: {
                title: step.title,
                description,
                popoverClass,
                showButtons,
                ...(step.side ? { side: step.side } : {}),
                ...(step.align ? { align: step.align } : {}),
                nextBtnText:
                    (step.kind === 'info' && step.nextText) ||
                    (isLastStep ? 'Готово ✓' : 'Далее →'),
                onNextClick: () => {
                    if (isLastStep) {
                        didComplete = true
                        driverInstance?.destroy()
                    } else {
                        currentStepIndex++
                        showStep(currentStepIndex)
                    }
                },
            },
        }

        // 5. Показываем шаг через highlight
        if (driverInstance) {
            driverInstance.highlight(driveStep)
        }

        // 6. Для wait-click — вешаем listener на элемент
        if (step.kind === 'wait-click' && step.element) {
            // Небольшая задержка чтобы driver.js успел применить highlight
            await new Promise((r) => setTimeout(r, 100))

            const el = document.querySelector<HTMLElement>(step.element)
            if (el instanceof HTMLElement) {
                currentTargetEl = el
                clickListener = async () => {
                    cleanupListener()
                    if (step.waitForNext) {
                        await waitForElementInternal(step.waitForNext, step.waitTimeoutMs ?? 5000)
                    }
                    await new Promise((r) => setTimeout(r, 250))

                    if (isLastStep) {
                        didComplete = true
                        driverInstance?.destroy()
                    } else {
                        currentStepIndex++
                        showStep(currentStepIndex)
                    }
                }
                el.addEventListener('click', clickListener, true)
            }
        }
    }

    const driverConfig: Config = {
        showProgress: true,
        progressText: `{{current}} из ${preparedSteps.length}`,
        popoverClass: 'smashclub-popover',
        overlayColor: '#000',
        overlayOpacity: 0.65,
        allowClose: false,
        smoothScroll: true,
        stagePadding: 8,
        stageRadius: 16,
        allowKeyboardControl: true,
        disableActiveInteraction: false,
        onDestroyStarted: () => {
            cleanupListener()
            if (!didComplete) {
                config.onSkip?.()
            } else {
                config.onComplete?.()
            }
            driverInstance?.destroy()
        },
    }

    driverInstance = driver(driverConfig)

    // Запускаем первый шаг
    showStep(0)

    return driverInstance
}

// ============================================================
// Утилиты
// ============================================================

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function waitForElement(
    selector: string,
    timeoutMs = 3000
): Promise<Element | null> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
        const el = document.querySelector(selector)
        if (el) return el
        await sleep(50)
    }
    return null
}