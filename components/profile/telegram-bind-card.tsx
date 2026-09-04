'use client'

import { useState } from 'react'
import { Send, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TelegramAuthButton } from '@/components/auth/telegram-auth-button'

export function TelegramBindCard({ isLinked }: { isLinked: boolean }) {
    return (
        <div className="bg-card border border-card rounded-2xl p-4 shadow-card space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#229ED9]/10 text-[#229ED9]">
                        <Send className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-strong">Telegram аккаунт</div>
                        <div className="text-xs text-muted">
                            {isLinked ? 'Привязан к вашему профилю' : 'Вход в 1 клик без паролей'}
                        </div>
                    </div>
                </div>

                {isLinked && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-success bg-success-muted px-2.5 py-1 rounded-full border border-success-border">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Подключен</span>
                    </div>
                )}
            </div>

            {!isLinked && (
                <div className="pt-2 border-t border-subtle">
                    <TelegramAuthButton />
                </div>
            )}
        </div>
    )
}