'use client'

import dynamic from 'next/dynamic'
import type { OnboardingProgress } from '@/shared/onboarding/types'

const TourLauncher = dynamic(
    () => import('./tour-launcher').then((m) => m.TourLauncher),
    { ssr: false }
)

type Props = {
    onboarding: OnboardingProgress | null
    isCoach: boolean
    userName: string
}

export function TourLauncherLazy(props: Props) {
    return <TourLauncher {...props} />
}