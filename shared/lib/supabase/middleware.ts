import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// Маршруты, где авторизация НЕ обязательна
const PUBLIC_PREFIXES = [
    '/login',
    '/register',
    '/auth', // Telegram / MAX
    '/api',  // webhooks
    '/manifest.json',
    '/home',
    '/feed',
    '/profile',
    '/schedule',
    '/tournaments',
    '/offline',
    '/privacy',
    '/terms',
    '/forgot-password'
]

// Маршруты строго только для залогиненных
const STRICT_PROTECTED_PREFIXES = [
    '/feed/new',
    '/tournaments/new',
    '/profile/settings',
    '/profile/rackets',
    '/profile/feedback',
]

export async function updateSession(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (pathname.startsWith('/auth') || pathname.startsWith('/api/webhooks') || pathname.startsWith('/api/dev')) {
        return NextResponse.next()
    }

    // 1. Корень `/`: быстрый редирект без тяжёлых сетевых проверок
    if (pathname === '/') {
        const hasAuthCookie = request.cookies.getAll().some(c => c.name.includes('auth-token'))
        const url = request.nextUrl.clone()
        url.pathname = hasAuthCookie ? '/home' : '/feed'
        return NextResponse.redirect(url)
    }

    // 2. Если это публичный роут и НЕ строго защищённый — пропускаем МГНОВЕННО
    const isStrictProtected = STRICT_PROTECTED_PREFIXES.some((p) => pathname.startsWith(prefix(p)))
    const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(prefix(p)))

    if (isPublic && !isStrictProtected) {
        return NextResponse.next()
    }

    // 3. Для защищённых роутов создаём клиент Supabase
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

    const { data: { user } } = await supabase.auth.getUser()

    // Если пытаются зайти на защищённый роут без юзера
    if (!user && !isPublic) {
        const loginUrl = new URL('/login', request.url)
        const currentPath = request.nextUrl.pathname + request.nextUrl.search
        if (currentPath && currentPath !== '/' && currentPath !== '/login') {
            loginUrl.searchParams.set('next', currentPath)
        }
        return NextResponse.redirect(loginUrl)
    }

    // Залогинен и идёт на логин/регистрацию → отправляем на /home
    if (user && (pathname === '/login' || pathname === '/register')) {
        const url = request.nextUrl.clone()
        url.pathname = '/home'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

function prefix(p: string) { return p }

export const config = {
    matcher: [
        /*
         * Исключаем статику, картинки, шрифты и внутренние _next файлы
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}