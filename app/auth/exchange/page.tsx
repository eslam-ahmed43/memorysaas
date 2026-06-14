'use client'
import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ExchangeContent() {
    const router = useRouter()

    useEffect(() => {
        let timeout: NodeJS.Timeout

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    clearTimeout(timeout)
                    const res = await fetch(`/api/profile?user_id=${session.user.id}`)
                    const data = await res.json()
                    if (data.profile) {
                        router.push('/dashboard')
                    } else {
                        router.push('/onboarding')
                    }
                }
            }
        )

        timeout = setTimeout(() => {
            subscription.unsubscribe()
            router.push('/login?error=timeout')
        }, 10000)

        return () => {
            clearTimeout(timeout)
            subscription.unsubscribe()
        }
    }, [])

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center">
                <div className="text-4xl mb-4 animate-pulse">🧠</div>
                <p className="text-white text-lg font-medium">Authenticating...</p>
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