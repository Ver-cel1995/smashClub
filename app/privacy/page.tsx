import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Политика конфиденциальности — SmashClub',
    description: 'Политика обработки персональных данных пользователей SmashClub',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-app">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-card border-b border-card">
                <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
                    <Link
                        href="/login"
                        className="p-2 -ml-2 rounded-lg hover:bg-hover text-muted"
                        aria-label="Назад"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <Shield className="w-5 h-5 text-accent" />
                    <h1 className="text-lg font-semibold text-strong">
                        Конфиденциальность
                    </h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-2xl mx-auto px-4 py-6 space-y-8 text-main leading-relaxed">
                <section>
                    <h2 className="text-xl font-bold text-strong mb-2">
                        Политика обработки персональных данных
                    </h2>
                </section>

                <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-strong">1. Общие положения</h3>
                    <p>
                        Настоящая Политика определяет порядок обработки и защиты персональных данных
                        пользователей мобильного веб-приложения <strong>SmashClub</strong> (далее — «Приложение»,
                        «Сервис»), расположенного по адресу{' '}
                        <a href="https://smash-club-three.vercel.app" className="text-accent underline">
                            smash-club-three.vercel.app
                        </a>.
                    </p>
                    <p>
                        Оператором персональных данных является{' '}
                        <strong>Администрация проекта SmashClub</strong> (далее — «Оператор»). Связь с Оператором
                        осуществляется по электронной почте:{' '}
                        <a href="mailto:support@smash-club-three.vercel.app" className="text-accent underline">
                            support@smash-club-three.vercel.app
                        </a>.
                    </p>
                    <p>
                        Используя Сервис, вы подтверждаете, что ознакомились с настоящей Политикой
                        и даёте согласие на обработку персональных данных в описанных ниже целях.
                    </p>
                </section>

                <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-strong">2. Какие данные мы собираем</h3>
                    <p className="font-medium text-strong">2.1. При регистрации и авторизации:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Адрес электронной почты</li>
                        <li>Пароль (хранится в хэшированном виде, мы не видим его в открытом виде)</li>
                        <li>Идентификатор и имя профиля Telegram (при входе через Telegram)</li>
                        <li>Идентификатор и имя профиля MAX (при входе через MAX)</li>
                    </ul>

                    <p className="font-medium text-strong mt-3">2.2. В профиле пользователя:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Фамилия и имя</li>
                        <li>Пол</li>
                        <li>Возрастная группа</li>
                        <li>Город</li>
                        <li>Фотография (аватар) — загружается добровольно</li>
                        <li>Спортивные рейтинги и статистика</li>
                        <li>Информация о ракетках (модель, статус ремонта)</li>
                    </ul>

                    <p className="font-medium text-strong mt-3">2.3. В процессе использования:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Отметки посещаемости тренировок («приду / не приду»)</li>
                        <li>Посты, комментарии, реакции в ленте</li>
                        <li>Регистрация на турниры и поездки</li>
                        <li>Обращения в службу обратной связи (включая скриншоты)</li>
                        <li>Результаты опросов</li>
                    </ul>

                    <p className="font-medium text-strong mt-3">2.4. Технические данные:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>IP-адрес (автоматически фиксируется сервером)</li>
                        <li>Тип браузера и операционной системы</li>
                        <li>Данные файлов cookie и локального хранилища (тема оформления, прогресс онбординга)</li>
                        <li>Push-подписка (если вы разрешили уведомления)</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-strong">3. Цели обработки</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Предоставление доступа к функционалу Сервиса (расписание, турниры, лента)</li>
                        <li>Организация тренировочного процесса и учёт посещаемости</li>
                        <li>Регистрация на турниры, формирование пар и сеток</li>
                        <li>Организация поездок и соревнований</li>
                        <li>Коммуникация внутри клуба (посты, комментарии, опросы)</li>
                        <li>Учёт спортивного инвентаря (ракетки, ремонт)</li>
                        <li>Обработка обращений и обратной связи</li>
                        <li>Обеспечение безопасности и предотвращение злоупотреблений</li>
                        <li>Улучшение работы Сервиса и аналитика использования</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-strong">4. Правовые основания обработки</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                            <strong>Согласие субъекта</strong> (ст. 6 ч. 1 п. 1 ФЗ-152) — при регистрации
                            вы даёте явное согласие на обработку данных
                        </li>
                        <li>
                            <strong>Исполнение договора</strong> (ст. 6 ч. 1 п. 5 ФЗ-152) — предоставление
                            доступа к Сервису в соответствии с Пользовательским соглашением
                        </li>
                        <li>
                            <strong>Законный интерес</strong> (ст. 6 ч. 1 п. 7 ФЗ-152) — обеспечение
                            безопасности, предотвращение мошенничества
                        </li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-strong">5. Где хранятся данные</h3>
                    <p>
                        Данные хранятся в облачной инфраструктуре{' '}
                        <strong>Supabase</strong> (база данных PostgreSQL) и{' '}
                        <strong>Vercel</strong> (хостинг приложения).
                    </p>
                    <p>
                        Оператор принимает все необходимые организационные и технические меры
                        для защиты данных в соответствии со ст. 19 ФЗ-152, включая:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Шифрование данных при передаче (TLS/HTTPS)</li>
                        <li>Хэширование паролей (bcrypt)</li>
                        <li>Политики доступа на уровне строк (Row Level Security)</li>
                        <li>Ограничение доступа к административным функциям по ролям</li>
                        <li>Rate limiting для защиты от автоматических атак</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-strong">6. Передача данных третьим лицам</h3>
                    <p>Мы не продаём и не передаём ваши данные третьим лицам для маркетинговых целей.</p>
                    <p>Данные могут быть переданы следующим сервисам исключительно для функционирования Сервиса:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                            <strong>Supabase, Inc.</strong> — хранение базы данных и файлов
                            (<a href="https://supabase.com/privacy" className="text-accent underline" target="_blank" rel="noopener">политика</a>)
                        </li>
                        <li>
                            <strong>Vercel, Inc.</strong> — хостинг и доставка приложения
                            (<a href="https://vercel.com/legal/privacy-policy" className="text-accent underline" target="_blank" rel="noopener">политика</a>)
                        </li>
                        <li>
                            <strong>Google LLC (Gemini API)</strong> — распознавание PDF-документов
                            турниров (передаются только файлы турниров, не персональные данные пользователей;
                            <a href="https://policies.google.com/privacy" className="text-accent underline" target="_blank" rel="noopener">политика</a>)
                        </li>
                        <li>
                            <strong>Telegram Messenger Inc.</strong> — авторизация через Telegram
                            (<a href="https://telegram.org/privacy" className="text-accent underline" target="_blank" rel="noopener">политика</a>)
                        </li>
                        <li>
                            <strong>ООО «Мессенджер» (MAX)</strong> — авторизация через мессенджер MAX
                            (при использовании данного способа входа)
                        </li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-strong">7. Сроки хранения</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                            <strong>Данные профиля</strong> — до момента удаления аккаунта пользователем
                            или по запросу
                        </li>
                        <li>
                            <strong>Посты и комментарии</strong> — до удаления автором или администратором;
                            автоматические посты о расписании удаляются через 24 часа после даты тренировки
                        </li>
                        <li>
                            <strong>Опросы</strong> — автоматически удаляются через 14 дней после создания
                        </li>
                        <li>
                            <strong>Данные турниров</strong> — архивируются после завершения;
                            PDF-файлы удаляются автоматически
                        </li>
                        <li>
                            <strong>Логи rate limiting</strong> — автоматически удаляются через 24 часа
                        </li>
                        <li>
                            <strong>Обращения в обратную связь</strong> — до обработки и ответа,
                            но не более 3 лет
                        </li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-strong">8. Ваши права</h3>
                    <p>В соответствии с ФЗ-152 вы имеете право:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Получить информацию об обработке ваших персональных данных</li>
                        <li>Запросить копию ваших данных (выгрузку)</li>
                        <li>Исправить неточные или неполные данные через настройки профиля</li>
                        <li>Удалить аккаунт и все связанные данные (через настройки профиля или запрос Оператору)</li>
                        <li>Отозвать согласие на обработку данных</li>
                        <li>Обжаловать действия Оператора в Роскомнадзоре</li>
                    </ul>
                    <p>
                        Для реализации прав направьте запрос на{' '}
                        <a href="mailto:support@smash-club-three.vercel.app" className="text-accent underline">support@smash-club-three.vercel.app</a>.
                        Срок ответа — не более 30 дней (ст. 20 ФЗ-152).
                    </p>
                </section>

                <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-strong">9. Файлы cookie и локальное хранилище</h3>
                    <p>Сервис использует:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                            <strong>Сессионные cookie</strong> — для поддержания авторизации
                            (необходимы для работы Сервиса)
                        </li>
                        <li>
                            <strong>localStorage</strong> — для сохранения темы оформления
                            и прогресса онбординга (не передаются на сервер)
                        </li>
                        <li>
                            <strong>Service Worker cache</strong> — для работы в режиме PWA
                            и офлайн-доступа (кэшируются только статические ресурсы и изображения)
                        </li>
                    </ul>
                    <p>
                        Сервис не использует рекламные или аналитические cookie третьих лиц.
                    </p>
                </section>

                <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-strong">10. Возрастные ограничения</h3>
                    <p>
                        Сервис предназначен для спортсменов всех возрастов. Пользователи младше 14 лет
                        могут использовать Сервис только с согласия родителей или законных представителей.
                        При регистрации пользователя младше 14 лет согласие на обработку данных
                        должно быть дано родителем (законным представителем).
                    </p>
                </section>

                <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-strong">11. Изменения Политики</h3>
                    <p>
                        Оператор вправе вносить изменения в настоящую Политику. Актуальная версия
                        всегда доступна по адресу{' '}
                        <a href="/privacy" className="text-accent underline">/privacy</a>.
                        При существенных изменениях пользователи будут уведомлены через ленту Сервиса.
                    </p>
                </section>

                <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-strong">12. Контакты и поддержка</h3>
                    <p>
                        По всем вопросам, связанным с обработкой персональных данных, отзывом согласия или удалением аккаунта, вы можете обращаться по электронной почте:
                    </p>
                    <ul className="list-none space-y-1">
                        <li>E-mail: <a href="mailto:support@smash-club-three.vercel.app" className="text-accent underline">support@smash-club-three.vercel.app</a></li>
                        <li>Территория действия: Российская Федерация</li>
                    </ul>
                </section>

                <footer className="pt-6 border-t border-subtle text-center text-dim text-sm">
                    <p>
                        <Link href="/terms" className="text-accent underline">
                            Пользовательское соглашение
                        </Link>
                    </p>
                    <p className="mt-2">© {new Date().getFullYear()} SmashClub</p>
                </footer>
            </main>
        </div>
    );
}