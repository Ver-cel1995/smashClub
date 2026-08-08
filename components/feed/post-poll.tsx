'use client'

import { cn } from '@/shared/lib/utils'
import { voteWord } from '@/shared/lib/format'

interface PostPollProps {
    question: string
    options: Array<{ id: string; text: string; votes: number }>
    multipleChoice: boolean
    /** Голосовал ли текущий пользователь */
    hasVoted?: boolean
    /** За какие option_id проголосовал */
    votedFor?: string[]
}

export function PostPoll({
                             question,
                             options,
                             hasVoted = false,
                         }: PostPollProps) {
    const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0)

    return (
        <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/50 p-4">
            <h4 className="text-sm font-semibold text-white">{question}</h4>

            <div className="space-y-2">
                {options.map((option) => {
                    const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0

                    return (
                        <div
                            key={option.id}
                            className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5"
                        >
                            {hasVoted && (
                                <div
                                    className="absolute inset-y-0 left-0 bg-lime-400/20 transition-all"
                                    style={{ width: `${percentage}%` }}
                                />
                            )}
                            <div className="relative flex items-center justify-between gap-2">
                                <span className="text-sm text-white">{option.text}</span>
                                <span className="text-xs font-medium text-neutral-400 shrink-0">
                  {option.votes}
                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            <p className="text-xs text-neutral-500">
                {totalVotes} {voteWord(totalVotes)}
                {!hasVoted && ' · ты не голосовал'}
            </p>
        </div>
    )
}