import Link from 'next/link'
import { Megaphone } from 'lucide-react'
import { formatTrainingDate } from '@/shared/lib/format'
import { TRAINING_STATUS_META } from '@/shared/lib/training-status'
import { formatRelativeTime } from '@/shared/lib/format'
import type { Post, Profile, Training } from '@/types'

type Props = {
    announcement?:
        | (Post & { author: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> })
        | null
    affectedTraining?: Training | null
}

export function ScheduleNoteCard({ announcement, affectedTraining }: Props) {
    // Приоритет: авто-пост от тренера
    if (announcement) {
        return (
            <Link
                href={`/feed/${announcement.id}`}
                className="block rounded-2xl border border-primary/30 bg-primary/5 p-4 transition active:scale-[0.99]"
            >
                <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                        <Megaphone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-primary">От тренера</span>
                        <span className="text-[10px] text-muted-foreground">
              {announcement.author.full_name} •{' '}
                            {formatRelativeTime(announcement.created_at)}
            </span>
                    </div>
                </div>

                {announcement.title && (
                    <h3 className="mb-1 text-sm font-semibold">{announcement.title}</h3>
                )}
                {announcement.content && (
                    <p className="line-clamp-3 text-sm text-foreground/80">
                        {announcement.content}
                    </p>
                )}
            </Link>
        )
    }

    // Фолбэк: системная заметка про отменённую/специальную тренировку
    if (affectedTraining) {
        const meta = TRAINING_STATUS_META[affectedTraining.status]
        return (
            <div
                className={`rounded-2xl border ${meta.borderColor} ${meta.bgColor} p-4`}
            >
                <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                    <span>{meta.icon}</span>
                    <span>Изменение в расписании</span>
                </div>
                <div className={`text-sm font-semibold ${meta.color}`}>
                    {formatTrainingDate(affectedTraining.date)} — {meta.label}
                </div>
                {affectedTraining.status_note && (
                    <p className="mt-1 text-xs text-foreground/80">
                        {affectedTraining.status_note}
                    </p>
                )}
            </div>
        )
    }

    return null
}