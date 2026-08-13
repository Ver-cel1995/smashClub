'use client'

import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { PostCard } from '@/components/feed/post-card'
import { CreatePostFab } from '@/components/feed/create-post-fab'
import { EmptyState } from '@/components/shared/empty-state'
import { GalleryTab } from './gallery-tab'
import type { PostWithAuthor, ReactionGroup } from '@/app/(main)/feed/queries'
import {Button} from "@/components/ui/button";

type Tab = 'feed' | 'gallery'

type Props = {
    posts: PostWithAuthor[]
    reactionsMap: Record<string, ReactionGroup[]>
    votesMap: Record<string, string[]>
    isCoach: boolean
    galleryMonths: string[]
}

export function FeedTabs({
                             posts,
                             reactionsMap,
                             votesMap,
                             isCoach,
                             galleryMonths,
                         }: Props) {
    const [tab, setTab] = useState<Tab>('feed')

    return (
        <div  className="flex flex-col">
            {/* Табы */}
            <div className="flex gap-2 px-4 pt-4">
                <Button
                    size="sm"
                    variant={tab === 'feed' ? 'secondary' : 'outline'}
                    onClick={() => setTab('feed')}
                >
                    Лента
                </Button>
                <Button
                    size="sm"
                    variant={tab === 'gallery' ? 'secondary' : 'outline'}
                    onClick={() => setTab('gallery')}
                >
                    Галерея
                </Button>
            </div>

            {/* Контент */}
            <div className="p-4" data-tour="feed-list">
                {tab === 'feed' && (
                    <>
                        {posts.length === 0 ? (
                            <EmptyState
                                icon="📰"
                                title="Пока пусто"
                                description={
                                    isCoach
                                        ? 'Напиши первый пост — расскажи о ближайших планах'
                                        : 'Скоро здесь появятся новости от тренера'
                                }
                            />
                        ) : (
                            <div className="space-y-3">
                                {posts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        isCoach={isCoach}
                                        reactions={reactionsMap[post.id] || []}
                                        votedFor={votesMap[post.id] || []}
                                    />
                                ))}
                            </div>
                        )}
                        {isCoach && <CreatePostFab />}
                    </>
                )}

                {tab === 'gallery' && (
                    <GalleryTab initialMonths={galleryMonths} />
                )}
            </div>
        </div>
    )
}