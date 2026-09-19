'use client'

import { Bell } from 'lucide-react'
import { toast } from 'sonner'

export function NotificationBell() {
    return (
        <button
            type="button"
            onClick={() => toast.info('Уведомления скоро появятся', { duration: 2000 })}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-hover hover:text-strong"
            aria-label="Уведомления"
        >
            <Bell className="h-5 w-5" />
        </button>
    )
}