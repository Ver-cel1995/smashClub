import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)

    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as
        | 'magiclink'
        | 'email'
        | 'signup'
        | 'recovery'
        | 'invite'
        | null
    const next = searchParams.get('next') ?? '/home'

    const cookieStore = await cookies()

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // ignore
                    }
                },
            },
        }
    )

    // PKCE
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
        console.error('[auth/callback] exchangeCode', error)
    }

    // Magic link / OTP по token_hash (наш Telegram flow)
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
        console.error('[auth/callback] verifyOtp', error)
    }

    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}