import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

const PUBLIC_ROUTES = ['/login', '/register']

const AUTH_ONLY_ROUTES = ['/login', '/register']

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // ВАЖНО: getUser() ходит в сеть. Обязательно вызываем — иначе токены не обновятся.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
    const isAuthOnly = AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route))
    const isRoot = pathname === '/'

    // 1. Не залогинен и идёт на защищённый маршрут → на login
    if (!user && !isPublic && !isRoot) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 2. Залогинен и идёт на login/register → на home
    if (user && isAuthOnly) {
        const url = request.nextUrl.clone()
        url.pathname = '/home'
        return NextResponse.redirect(url)
    }

    // 3. Корень: редиректим здесь а не в page.tsx, чтобы не дублировать
    if (isRoot) {
        const url = request.nextUrl.clone()
        url.pathname = user ? '/home' : '/login'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}