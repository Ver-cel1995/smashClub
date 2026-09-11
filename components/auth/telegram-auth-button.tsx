'use client'

import {useRef, useState} from 'react'
import {CheckCircle2, ExternalLink, Loader2, Send, X} from 'lucide-react'
import {Button} from '@/components/ui/button'


export function TelegramAuthButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [session, setSession] = useState<{
        code: string
        botUsername: string
    } | null>(null)
    const [verified, setVerified] = useState(false)

    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const handleStartTgAuth = async () => {
        setLoading(true)
        setLoading(false)
        setVerified(false)
        setIsOpen(true)
    }



    const tgUrl = session
        ? `https://t.me/${session.botUsername}?start=${session.code}`
        : '#'

    return (
        <>
            <Button
                type="button"
                variant="outline"
                onClick={handleStartTgAuth}
                disabled={loading}
                className="w-full gap-2 border-subtle bg-subtle hover:bg-hover text-strong font-medium py-2.5 rounded-xl transition-all"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-info" />
                ) : (
                    <Send className="w-4 h-4 text-[#229ED9]" />
                )}
                Войти через Telegram
            </Button>

            {/* Модалка ожидания клика в Telegram */}
            {isOpen && session && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm rounded-2xl border border-card bg-elevated p-6 shadow-elevated text-center">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-muted hover:text-strong p-1 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#229ED9]/10 text-[#229ED9]">
                            <Send className="h-7 w-7" />
                        </div>

                        <h3 className="text-lg font-bold text-strong mb-1">
                            Вход через Telegram
                        </h3>
                        <p className="text-xs text-muted mb-6">
                            Нажмите кнопку ниже, чтобы открыть бота и подтвердить вход в 1 клик.
                        </p>

                        {verified ? (
                            <div className="flex flex-col items-center gap-2 py-4 text-success">
                                <CheckCircle2 className="w-10 h-10 animate-bounce" />
                                <span className="text-sm font-semibold">
                  Авторизация пройдена! Входим...
                </span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <a
                                    href={tgUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] hover:bg-[#1d8ebf] text-white font-semibold py-3 px-4 text-sm transition-all shadow-card"
                                >
                                    <span>Открыть бота @{session.botUsername}</span>
                                    <ExternalLink className="w-4 h-4" />
                                </a>

                                <div className="flex items-center justify-center gap-2 text-xs text-muted pt-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                                    <span>Ожидаем нажатия «Запустить» в боте...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}