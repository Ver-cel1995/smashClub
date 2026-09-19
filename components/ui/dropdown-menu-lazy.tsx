'use client'

import dynamic from 'next/dynamic'

export const DropdownMenu = dynamic(
    () => import('@/components/ui/dropdown-menu').then((m) => m.DropdownMenu),
    { ssr: false }
)
export const DropdownMenuContent = dynamic(
    () => import('@/components/ui/dropdown-menu').then((m) => m.DropdownMenuContent),
    { ssr: false }
)
export const DropdownMenuItem = dynamic(
    () => import('@/components/ui/dropdown-menu').then((m) => m.DropdownMenuItem),
    { ssr: false }
)
export const DropdownMenuTrigger = dynamic(
    () => import('@/components/ui/dropdown-menu').then((m) => m.DropdownMenuTrigger),
    { ssr: false }
)