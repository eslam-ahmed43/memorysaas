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
            console.log('=== EXCHANGE PAGE ===')
            console.log('Code:', code)

            // Check localStorage
            const allKeys = Object.keys(localStorage)
            console.log('localStorage keys:', allKeys)
            allKeys.forEach(key => {
                if (key.includes('supabase') || key.includes('pkce') || key.includes('code')) {
                    console.log(key, ':', localStorage.getItem(key)?.substring(0, 50))
                }
            })

            if (code) {
                const { data, error } = await supabase.auth.exchangeCodeForSession(code)
                console.log('Exchange error:', error?.message)
                console.log('Exchange user:', data?.session?.user?.email)

                if (error) {
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

            router.push('/login')
        }

        exchange()
    }, [])

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center">
                <div className="text-4xl mb-4 animate-pulse">🧠</div>
                <p className="text-white text-lg font-medium">Signing you in...</p>
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