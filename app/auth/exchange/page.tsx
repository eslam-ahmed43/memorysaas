'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ExchangeContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        async function exchange() {
            const code = searchParams.get('code')

            if (code) {
                const { data, error } = await supabase.auth.exchangeCodeForSession(code)

                if (error) {
                    console.error('Exchange error:', error.message)
                    router.push('/login?error=oauth')
                    return
                }

                if (data.session?.user) {
                    const res = await fetch(`/api/profile?user_id=${data.session.user.id}`)
                    const profile = await res.json()
                    router.push(profile.profile ? '/dashboard' : '/onboarding')
                    return
                }
            }

            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                const res = await fetch(`/api/profile?user_id=${session.user.id}`)
                const profile = await res.json()
                router.push(profile.profile ? '/dashboard' : '/onboarding')
            } else {
                router.push('/login?error=no-session')
            }
        }

        exchange()
    }, [])

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center">
                <div className="text-4xl mb-4 animate-pulse">🧠</div>
                <p className="text-white text-lg font-medium">Signing you in...</p>
                <p className="text-gray-500 text-sm mt-2">Please wait</p>
            </div>
        </div>
    )
}

export default function Exchange() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <p className="text-white">Loading...</p>
            </div>
        }>
            <ExchangeContent />
        </Suspense>
    )
}