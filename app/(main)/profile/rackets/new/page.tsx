import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getCurrentUser } from '@/shared/lib/auth'
import { NewRacketForm } from '@/components/profile/new-racket-form'

export const dynamic = 'force-dynamic'

export default async function NewRacketPage() {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    return (
        <div className="flex flex-col gap-3 p-4 pb-24">
            <Link
                href="/profile/rackets"
                className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white"
            >
                <ChevronLeft className="h-4 w-4" />
                Мои ракетки
            </Link>

            <h1 className="text-xl font-bold text-white">Новая заявка</h1>
            <p className="text-xs text-neutral-500">
                Укажи количество ракеток и что нужно сделать
            </p>

            <NewRacketForm />
        </div>
    )
}