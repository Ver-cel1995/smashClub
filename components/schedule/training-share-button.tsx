'use client'

import { ShareButton } from '@/components/shared/share-button'
import { buildTrainingShareData } from '@/shared/lib/share'
import type { Training } from '@/types'

type Props = {
    training: Pick<Training, 'id' | 'date' | 'start_time' | 'end_time' | 'status' | 'status_note'>
    variant?: 'default' | 'icon'
}

export function TrainingShareButton({ training, variant = 'default' }: Props) {
    return <ShareButton data={buildTrainingShareData(training)} variant={variant} />
}