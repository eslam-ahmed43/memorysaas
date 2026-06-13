'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

function ExchangeContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        async function exchange() {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { data: { session } } = await supabase.auth.getSession()

            if (session?.user) {
                const res = await fetch(`/api/profile?user_id=${session.user.id}`)
                const profile = await res.json()
                if (profile.profile) {
                    router.push('/dashboard')
                } else {
                    router.push('/onboarding')
                }
                return
            }

            router.push('/login?error=auth')
        }

        exchange()
    }, [])

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center">
                <div className="text-4xl mb-4 animate-pulse">🧠</div>
                <p className="text-white">Authenticating, please wait...</p>
            </div>
        </div>
    )
}

export default function Exchange() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4 animate-pulse">🧠</div>
                    <p className="text-white">Loading...</p>
                </div>
            </div>
        }>
            <ExchangeContent />
        </Suspense>
    )
}