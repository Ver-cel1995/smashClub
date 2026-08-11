'use client'

import { useState } from 'react'
import { Wallet, ChevronRight } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { ProfilePayments } from '@/app/(main)/profile/queries'

type Props = {
    payments: ProfilePayments
}

export function ProfilePaymentsCard({ payments }: Props) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-left transition active:scale-[0.99]"
            >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15">
                    <Wallet className="h-5 w-5 text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium uppercase text-neutral-500">
                        К оплате
                    </div>
                    <div className="text-xl font-bold text-white">{payments.total}₽</div>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-500" />
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent hideCloseButton>
                    <DialogHeader>
                        <DialogTitle>К оплате</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2">
                        <PaymentRow label="Турниры" amount={payments.tournaments} />
                        <PaymentRow label="Поездки" amount={payments.trips} />
                        <PaymentRow label="Ремонт ракеток" amount={payments.repair} />
                        <div className="mt-3 flex items-center justify-between border-t border-neutral-800 pt-3">
                            <span className="text-sm font-semibold text-white">Итого</span>
                            <span className="text-lg font-bold text-accent">
                                {payments.total}₽
                            </span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

function PaymentRow({ label, amount }: { label: string; amount: number }) {
    if (amount === 0) return null
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-300">{label}</span>
            <span className="font-medium text-white">{amount}₽</span>
        </div>
    )
}