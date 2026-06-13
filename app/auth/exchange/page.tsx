'use client'
import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ExchangeContent() {
    const router = useRouter()

    useEffect(() => {
        async function handleAuth() {
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.user) {
                const res = await fetch(`/api/profile?user_id=${session.user.id}`)
                const data = await res.json()
                if (data.profile) {
                    router.push('/dashboard')
                } else {
                    router.push('/onboarding')
                }
                return
            }

            const hash = window.location.hash
            if (hash && hash.includes('access_token')) {
                supabase.auth.onAuthStateChange(async (event, session) => {
                    if (event === 'SIGNED_IN' && session?.user) {
                        const res = await fetch(`/api/profile?user_id=${session.user.id}`)
                        const data = await res.json()
                        if (data.profile) {
                            router.push('/dashboard')
                        } else {
                            router.push('/onboarding')
                        }
                    }
                })
                return
            }

            router.push('/login')
        }

        handleAuth()
    }, [])

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center">
                <div className="text-4xl mb-4 animate-pulse">🧠</div>
                <p className="text-white">Authenticating...</p>
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