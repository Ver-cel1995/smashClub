'use client'

import {useOptimistic} from 'react'
import {Check, Loader2} from 'lucide-react'
import {toast} from 'sonner'
import {votePoll} from '@/app/(main)/feed/actions'
import {cn} from '@/shared/lib/utils'
import {voteWord} from '@/shared/lib/format'
import { useProgressAction } from "@/shared/hooks/use-progress-action"

interface PollOption {
    id: string
    text: string
    votes: number
}

interface PostPollProps {
    postId: string
    question: string
    options: PollOption[]
    multipleChoice: boolean
    votedFor: string[]
}

export function PostPoll({
                             postId,
                             question,
                             options,
                             multipleChoice,
                             votedFor,
                         }: PostPollProps) {
    const [isPending, startTransition] = useProgressAction()
    const hasVoted = votedFor.length > 0

    const [optimisticOptions, updateOptimistic] = useOptimistic(
        { options, votedFor },
        (
            current: { options: PollOption[]; votedFor: string[] },
            action: { optionId: string }
        ) => {
            const isRemoving = current.votedFor.includes(action.optionId)

            if (isRemoving) {
                return {
                    options: current.options.map((o) =>
                        o.id === action.optionId ? { ...o, votes: Math.max(0, o.votes - 1) } : o
                    ),
                    votedFor: current.votedFor.filter((id) => id !== action.optionId),
                }
            }

            let newOptions = current.options
            let newVotedFor = current.votedFor

            // Если не multiple choice — убираем предыдущий голос
            if (!multipleChoice && current.votedFor.length > 0) {
                const prevId = current.votedFor[0]
                newOptions = newOptions.map((o) =>
                    o.id === prevId ? { ...o, votes: Math.max(0, o.votes - 1) } : o
                )
                newVotedFor = []
            }

            return {
                options: newOptions.map((o) =>
                    o.id === action.optionId ? { ...o, votes: o.votes + 1 } : o
                ),
                votedFor: [...newVotedFor, action.optionId],
            }
        }
    )

    const totalVotes = optimisticOptions.options.reduce((sum, opt) => sum + opt.votes, 0)
    const currentVotedFor = optimisticOptions.votedFor

    const handleVote = (optionId: string) => {
        startTransition(async () => {
            updateOptimistic({ optionId })

            const result = await votePoll(postId, optionId)
            if (!result.success) {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <div
            className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/50 p-4"
            onClick={(e) => e.stopPropagation()}
        >
            <h4 className="text-sm font-semibold text-white">{question}</h4>

            <div className="space-y-2">
                {optimisticOptions.options.map((option) => {
                    const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0
                    const isVoted = currentVotedFor.includes(option.id)
                    const showResults = currentVotedFor.length > 0

                    return (
                        <button
                            key={option.id}
                            type="button"
                            disabled={isPending}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleVote(option.id)
                            }}
                            className={cn(
                                'relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-all',
                                'disabled:opacity-70',
                                isVoted
                                    ? 'border-lime-400/40 bg-lime-400/5'
                                    : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                            )}
                        >
                            {/* Прогресс-бар */}
                            {showResults && (
                                <div
                                    className={cn(
                                        'absolute inset-y-0 left-0 transition-all duration-500',
                                        isVoted ? 'bg-lime-400/15' : 'bg-neutral-800/40'
                                    )}
                                    style={{ width: `${percentage}%` }}
                                />
                            )}

                            <div className="relative flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    {isVoted && <Check className="h-3.5 w-3.5 text-lime-400 shrink-0" />}
                                    <span className={cn('text-sm', isVoted ? 'text-lime-300 font-medium' : 'text-white')}>
                    {option.text}
                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {isPending && (
                                        <Loader2 className="h-3 w-3 animate-spin text-neutral-500" />
                                    )}
                                    {showResults && (
                                        <span className="text-xs font-medium text-neutral-400">
                      {Math.round(percentage)}%
                    </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span>
          {totalVotes} {voteWord(totalVotes)}
        </span>
                {multipleChoice && <span>· можно выбрать несколько</span>}
            </div>
        </div>
    )
}