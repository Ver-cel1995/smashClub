'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Trophy } from 'lucide-react'
import type {
    TournamentCategoryFull,
    MyParticipationInCategory,
} from '@/app/(main)/tournaments/[id]/queries'

const RegistrationDialog = dynamic(
    () => import('./registration-form').then((m) => m.RegistrationDialog),
    { ssr: false }
)

type Props = {
    tournamentId: string
    categories: TournamentCategoryFull[]
    myParticipation: Record<string, MyParticipationInCategory>
    currentUserId: string
    entryFee: number | null
    hasEntryFee: boolean
}

export function RegistrationFab(props: Props) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold uppercase tracking-wide text-[var(--accent-foreground)] shadow-accent hover:opacity-90 transition-all active:scale-95"
            >
                <Trophy className="h-5 w-5" />
                Участвовать
            </button>

            {open && (
                <RegistrationDialog
                    open={open}
                    onOpenChange={setOpen}
                    {...props}
                />
            )}
        </>
    )
}