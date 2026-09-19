'use client'

import { ShareButton } from '@/components/shared/share-button'
import { buildTrainingShareData } from '@/shared/lib/share'
import type { TrainingWithMeta } from '@/app/(main)/schedule/queries'

type Props = {
    training: TrainingWithMeta
}

export function CalendarShareButton({ training }: Props) {
    return (
        <ShareButton
            data={buildTrainingShareData(training)}
            variant="default"
            label="Поделиться"
            className="shrink-0 !py-3"
        />
    )
}