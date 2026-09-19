import Link from 'next/link'
import {
    User,
    LogIn,
    UserPlus,
    Calendar,
    Trophy,
    Wrench,
    Star,
    Settings,
    HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSelector } from '@/components/theme/theme-selector'

export function GuestProfileView() {
    return (
        <div className="space-y-4 pb-24 pt-2 px-4 max-w-md mx-auto">
            {/* 1. Карточка аватара Гостя (как на скриншоте) */}
            <div className="bg-card border border-card rounded-2xl p-6 text-center shadow-card flex flex-col items-center relative overflow-hidden">
                <div className="w-24 h-24 rounded-full bg-subtle border-2 border-strong flex items-center justify-center mb-3 text-muted">
                    <User className="w-12 h-12" />
                </div>

                <h1 className="text-xl font-bold text-strong">Гость SmashClub</h1>

                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-subtle text-muted border border-subtle">
                    Гость
                </div>

                <p className="text-xs text-muted mt-2">
                    ст. Кущёвская • ДЮСШ Бадминтон
                </p>
            </div>

            {/* 2. Промо-карточка возможностей клуба (вместо рейтинга/турниров) */}
            <div className="bg-card border border-accent/30 rounded-2xl p-5 shadow-card relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                <h2 className="text-sm font-bold text-strong mb-1 flex items-center gap-2">
                    <span>🏸</span> Присоединяйся к SmashClub
                </h2>
                <p className="text-xs text-muted mb-4">
                    Зарегистрируйся, чтобы открыть доступ ко всем функциям клуба:
                </p>

                <ul className="space-y-3 text-xs text-main mb-6">
                    <li className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-accent-muted text-accent shrink-0">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <span>Запись на тренировки и актуальное расписание</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-accent-muted text-accent shrink-0">
                            <Trophy className="w-4 h-4" />
                        </div>
                        <span>Регистрация на турниры и поиск партнёров</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-accent-muted text-accent shrink-0">
                            <Wrench className="w-4 h-4" />
                        </div>
                        <span>Заявки на перетяжку и ремонт ракеток</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-accent-muted text-accent shrink-0">
                            <Star className="w-4 h-4" />
                        </div>
                        <span>Личный рейтинг, статистика и достижения</span>
                    </li>
                </ul>

                {/* Кнопки авторизации */}
                <div className="flex flex-col gap-2.5">
                    <Link href="/login" className="w-full">
                        <Button variant="secondary" fullWidth className="gap-2">
                            <LogIn className="w-4 h-4" />
                            Войти в аккаунт
                        </Button>
                    </Link>

                    <Link href="/register" className="w-full">
                        <Button variant="outline" fullWidth className="gap-2">
                            <UserPlus className="w-4 h-4" />
                            Зарегистрироваться
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 3. Настройки темы (доступны гостю) */}
            <div className="bg-card border border-card rounded-2xl p-4 shadow-card space-y-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-subtle text-muted">
                        <Settings className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-strong">Тема и оформление</div>
                        <div className="text-xs text-muted">Внешний вид приложения</div>
                    </div>
                </div>
                <div className="pt-2 border-t border-subtle">
                    <ThemeSelector />
                </div>
            </div>

            {/* 4. Помощь */}
            <div className="bg-card border border-card rounded-2xl overflow-hidden shadow-card">
                <Link
                    href="/profile/settings/help"
                    className="flex items-center justify-between p-4 hover:bg-hover transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-subtle text-muted">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-strong">Помощь и обучение</span>
                    </div>
                    <span className="text-xs text-muted">›</span>
                </Link>
            </div>

            {/* 5. Быстрый вход вместо кнопки "Выйти" */}
            <Link href="/login" className="block w-full pt-2">
                <Button variant="ghost" fullWidth className="gap-2 text-accent hover:text-accent">
                    <LogIn className="w-4 h-4" />
                    Авторизоваться
                </Button>
            </Link>
        </div>
    )
}