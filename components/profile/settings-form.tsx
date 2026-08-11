'use client'

import {FormEvent, useRef, useState} from 'react'
import {Camera, Loader2} from 'lucide-react'
import {toast} from 'sonner'
import {Button} from '@/components/ui/button'
import {UserAvatar} from '@/components/user-avatar'
import {useProgressAction} from '@/shared/hooks/use-progress-action'
import {compressImage} from '@/shared/lib/image-compress'
import {CITY_OPTIONS} from '@/shared/lib/cities'
import {updateProfile} from '@/app/(main)/profile/actions'
import {createClient} from '@/shared/lib/supabase/client'
import type {Profile} from '@/types'
import {ThemeSelector} from '@/components/theme/theme-selector'

type Props = {
    profile: Profile
}

export function SettingsForm({ profile }: Props) {
    const [fullName, setFullName] = useState(profile.full_name ?? '')
    const [city, setCity] = useState(profile.city ?? 'kushchevskaya')
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
    const [avatarUploading, setAvatarUploading] = useState(false)
    const [runAction, isPending] = useProgressAction()

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return

        setAvatarUploading(true)
        try {
            const compressed = await compressImage(file, {
                maxSizeMB: 0.3,
                maxWidthOrHeight: 512,
                useWebp: true,
            })

            const supabase = createClient()
            const fileName = `${profile.id}/${Date.now()}.${compressed.name.split('.').pop()}`
            const { error: uploadErr } = await supabase.storage
                .from('avatars')
                .upload(fileName, compressed, { upsert: true })

            if (uploadErr) {
                console.error(uploadErr)
                toast.error('Не удалось загрузить аватар')
                return
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
            setAvatarUrl(data.publicUrl)
            toast.success('Аватар обновлён (не забудь сохранить)')
        } catch (e) {
            console.error(e)
            toast.error('Ошибка загрузки')
        } finally {
            setAvatarUploading(false)
        }
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()

        runAction(async () => {
            const formData = new FormData()
            formData.append('full_name', fullName.trim())
            formData.append('city', city)
            formData.append('avatar_url', avatarUrl)

            const result = await updateProfile(formData)
            if (result.success) {
                toast.success('Профиль обновлён')
            } else {
                toast.error(result.error || 'Ошибка')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Аватар */}
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
                <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={avatarUploading || isPending}
                    className="group relative"
                >
                    <UserAvatar
                        name={fullName || 'Игрок'}
                        avatarUrl={avatarUrl}
                        size="xl"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        {avatarUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                        ) : (
                            <Camera className="h-6 w-6 text-white" />
                        )}
                    </div>
                </button>
                <span className="text-xs text-neutral-500">Нажми чтобы сменить</span>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                />
            </div>

            {/* Имя */}
            <div>
                <label
                    htmlFor="full_name"
                    className="mb-1 block text-xs text-neutral-400"
                >
                    Имя
                </label>
                <input
                    id="full_name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-lime-400/40 focus:outline-none"
                />
            </div>

            {/* Город */}
            <div>
                <label htmlFor="city" className="mb-1 block text-xs text-neutral-400">
                    Город
                </label>
                <select
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-white focus:border-lime-400/40 focus:outline-none"
                >
                    {CITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Тема */}
            <ThemeSelector />

            <Button
                variant="secondary"
                size="md"
                fullWidth
                type="submit"
                disabled={isPending || avatarUploading || !fullName.trim()}
            >
                {isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
        </form>
    )
}