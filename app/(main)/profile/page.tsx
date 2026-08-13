// import Link from 'next/link'
// import { redirect } from 'next/navigation'
// import { Settings, ChevronRight, HelpCircle, LogOut } from 'lucide-react'
// import { getCurrentUser } from '@/shared/lib/auth'
// import {
//     getProfilePayments,
//     getUserRackets,
//     getUserUpcomingTournaments,
// } from './queries'
// import { ProfileHeader } from '@/components/profile/profile-header'
// import { ProfileStats } from '@/components/profile/profile-stats'
// import { ProfilePaymentsCard } from '@/components/profile/profile-payments-card'
// import { ProfileRacketsCard } from '@/components/profile/profile-rackets-card'
// import { ProfileTournamentsCard } from '@/components/profile/profile-tournaments-card'
// import { ProfileAchievements } from '@/components/profile/profile-achievements'
// import { ProfileSignOutButton } from '@/components/profile/profile-sign-out-button'
//
// export const dynamic = 'force-dynamic'
//
// export default async function ProfilePage() {
//     const user = await getCurrentUser()
//     if (!user) redirect('/login')
//
//     const [payments, rackets, tournaments] = await Promise.all([
//         getProfilePayments(user.userId),
//         getUserRackets(user.userId),
//         getUserUpcomingTournaments(user.userId),
//     ])
//
//     return (
//         <div className="flex flex-col gap-3 p-4 pb-24">
//             <ProfileHeader profile={user.profile} />
//             <ProfileStats profile={user.profile} />
//
//             {payments.total > 0 && <ProfilePaymentsCard payments={payments} />}
//
//             {/* Ракетки — всегда показываем, чтобы можно было создать первую заявку */}
//             <ProfileRacketsCard rackets={rackets} />
//
//             {tournaments.length > 0 && (
//                 <ProfileTournamentsCard tournaments={tournaments} />
//             )}
//
//             <ProfileAchievements />
//
//             {/* Настройки / Помощь / Выйти */}
//             <div className="mt-4 space-y-1 rounded-2xl border border bg-card p-1">
//                 <Link
//                     href="/profile/settings"
//                     className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white transition-colors hover:bg-neutral-800"
//                 >
//                     <Settings className="h-4 w-4 text-neutral-400" />
//                     Настройки
//                     <ChevronRight className="ml-auto h-4 w-4 text-neutral-500" />
//                 </Link>
//                 <Link
//                     href="/help"
//                     className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white transition-colors hover:bg-neutral-800"
//                 >
//                     <HelpCircle className="h-4 w-4 text-neutral-400" />
//                     Помощь
//                     <ChevronRight className="ml-auto h-4 w-4 text-neutral-500" />
//                 </Link>
//                 <ProfileSignOutButton />
//             </div>
//         </div>
//     )
// }


import {redirect} from 'next/navigation'
import Link from 'next/link'
import {Settings, ChevronRight, HelpCircle, MessageSquarePlus} from 'lucide-react'
import {getCurrentUser} from '@/shared/lib/auth'
import {
    getProfilePayments,
    getUserRackets,
    getUserUpcomingTournaments,
} from './queries'
import {getRepairForCoach} from '@/app/(main)/home/queries'
import {ProfileHeader} from '@/components/profile/profile-header'
import {ProfileStats} from '@/components/profile/profile-stats'
import {ProfilePaymentsCard} from '@/components/profile/profile-payments-card'
import {ProfileRacketsCard} from '@/components/profile/profile-rackets-card'
import {ProfileCoachRacketsCard} from '@/components/profile/profile-coach-rackets-card'
import {ProfileTournamentsCard} from '@/components/profile/profile-tournaments-card'
import {ProfileAchievements} from '@/components/profile/profile-achievements'
import {ProfileSignOutButton} from '@/components/profile/profile-sign-out-button'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    const isCoach = user.profile.role === 'coach'

    const [payments, rackets, tournaments, coachRepair] = await Promise.all([
        isCoach ? Promise.resolve(null) : getProfilePayments(user.userId),
        isCoach ? Promise.resolve([]) : getUserRackets(user.userId),
        getUserUpcomingTournaments(user.userId),
        isCoach ? getRepairForCoach() : Promise.resolve(null),
    ])

    return (
        <div className="flex flex-col gap-3 p-4 pb-24" data-tour="profile-main">
            <ProfileHeader profile={user.profile}/>
            <ProfileStats profile={user.profile}/>

            {!isCoach && payments && payments.total > 0 && (
                <ProfilePaymentsCard payments={payments}/>
            )}

            {isCoach ? (
                <ProfileCoachRacketsCard data={coachRepair}/>
            ) : (
                <ProfileRacketsCard rackets={rackets}/>
            )}

            {tournaments.length > 0 && (
                <ProfileTournamentsCard tournaments={tournaments}/>
            )}

            <ProfileAchievements/>

            <div className="mt-4 space-y-1 rounded-2xl border-card bg-card p-1">
                <Link
                    href="/profile/settings"
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white transition-colors hover:bg-neutral-800"
                >
                    <Settings className="h-4 w-4 text-neutral-400"/>
                    Настройки
                    <ChevronRight className="ml-auto h-4 w-4 text-neutral-500"/>
                </Link>
                <Link
                    href="/help"
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white transition-colors hover:bg-neutral-800"
                >
                    <HelpCircle className="h-4 w-4 text-neutral-400"/>
                    Помощь
                    <ChevronRight className="ml-auto h-4 w-4 text-neutral-500"/>
                </Link>
                <Link
                    href="/profile/feedback"
                    className="flex items-center gap-3 rounded-2xl border border-card bg-card p-4 transition-colors hover:border-strong hover:bg-hover"
                >
                    <div className="rounded-full bg-warning-muted p-2">
                        <MessageSquarePlus className="h-5 w-5 text-warning"/>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-strong">Идеи и баги</p>
                        <p className="text-xs text-muted">Расскажи что улучшить или что сломалось</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted"/>
                </Link>
                <ProfileSignOutButton/>
            </div>
        </div>
    )
}