import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/shared/lib/formatName'
import { cn } from '@/shared/lib/utils'
import {memo} from "react";

type Size = 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<Size, string> = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-24 w-24 text-2xl',
}

type UserAvatarProps = {
    name: string
    src?: string
    avatarUrl?: string | null
    size?: Size
    className?: string
}

export const UserAvatar = memo(function UserAvatar({
                                                       name,
                                                       avatarUrl,
                                                       size = 'md',
                                                       className,
                           }: UserAvatarProps) {
    return (
        <Avatar className={cn(sizeClasses[size], className)}>
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback className="bg-accent-muted text-accent font-semibold border border-accent">
                {getInitials(name)}
            </AvatarFallback>
        </Avatar>
    )
})