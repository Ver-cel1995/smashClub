import Link from 'next/link'
import { Pin } from 'lucide-react'
import { formatTrainingDate, formatRelativeTime } from '@/shared/lib/format'
import { TRAINING_STATUS_META } from '@/shared/lib/training-status'
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
                className="block rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 transition active:scale-[0.99]"
            >
                <div className="mb-2 flex items-center gap-2">
                    <Pin className="h-4 w-4 text-rose-400" />
                    <span className="text-xs font-semibold text-rose-400">От тренера</span>
                </div>

                {announcement.title && (
                    <h3 className="mb-1 text-sm font-bold text-[var(--text-main)]">
                        {announcement.title}
                    </h3>
                )}
                {announcement.content && (
                    <p className="line-clamp-3 text-xs text-[var(--text-main)] leading-relaxed">
                        {announcement.content}
                    </p>
                )}

                <div className="mt-3 text-[11px] text-[var(--text-muted)]">
                    {announcement.author.full_name} — {formatRelativeTime(announcement.created_at)}
                </div>
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
                <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-[var(--text-muted)]">
                    <span>{meta.icon}</span>
                    <span>Изменение в расписании</span>
                </div>
                <div className={`text-sm font-semibold ${meta.color}`}>
                    {formatTrainingDate(affectedTraining.date)} — {meta.label}
                </div>
                {affectedTraining.status_note && (
                    <p className="mt-1 text-xs text-[var(--text-main)]">
                        {affectedTraining.status_note}
                    </p>
                )}
            </div>
        )
    }

    return null
}
