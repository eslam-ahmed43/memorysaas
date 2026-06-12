import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    console.log('Full URL:', request.url)
    console.log('Code:', code)
    console.log('All params:', Object.fromEntries(searchParams))

    if (!code) {
        console.log('No code found, redirecting to login')
        return NextResponse.redirect(`${origin}/login`)
    }

    try {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch { }
                    },
                },
            }
        )

        console.log('Calling exchangeCodeForSession...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        console.log('Exchange result:', { email: data?.user?.email, error: error?.message })

        if (error || !data.user) {
            console.error('Auth error:', error?.message)
            return NextResponse.redirect(`${origin}/login?error=auth`)
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single()

        console.log('Profile found:', !!profile)

        const response = NextResponse.redirect(
            `${origin}${profile ? '/dashboard' : '/onboarding'}`
        )

        const allCookies = cookieStore.getAll()
        allCookies.forEach(cookie => {
            response.cookies.set(cookie.name, cookie.value, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/',
            })
        })

        return response

    } catch (err) {
        console.error('Callback error:', err)
        return NextResponse.redirect(`${origin}/login?error=auth`)
    }
}