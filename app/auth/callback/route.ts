import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    console.log('Callback hit! code:', code ? 'exists' : 'missing')

    if (!code) {
        return NextResponse.redirect(`${origin}/?error=no-code`)
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
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                        })
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        console.log('Exchange result:', { email: data?.user?.email, error: error?.message })

        if (error || !data.user) {
            return NextResponse.redirect(`${origin}/?error=auth`)
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

        if (!profile) {
            return NextResponse.redirect(`${origin}/onboarding`)
        }

        return NextResponse.redirect(`${origin}/dashboard`)

    } catch (err) {
        console.error('Callback error:', err)
        return NextResponse.redirect(`${origin}/?error=auth`)
    }
}