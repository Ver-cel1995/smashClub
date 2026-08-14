'use client'

import { ShareButton } from '@/components/shared/share-button'
import { buildTrainingShareData } from '@/shared/lib/share'
import type { Training } from '@/types'

type Props = {
    training: Pick<Training, 'id' | 'date' | 'start_time' | 'end_time' | 'status' | 'status_note'>
    variant?: 'default' | 'icon'
}

export function TrainingShareButton({ training, variant = 'default' }: Props) {
    // window доступен на клиенте
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

    // Пока не смонтировались — рендерим просто кнопку без данных (или скелетон)
    if (!baseUrl) {
        return null
    }

    const data = buildTrainingShareData(training, baseUrl)
    return <ShareButton data={data} variant={variant} />
}