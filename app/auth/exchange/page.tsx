'use client'
import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ExchangeContent() {
    const router = useRouter()

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    subscription.unsubscribe()
                    const res = await fetch(`/api/profile?user_id=${session.user.id}`)
                    const data = await res.json()
                    router.push(data.profile ? '/dashboard' : '/onboarding')
                }
            }
        )

        const timeout = setTimeout(() => {
            router.push('/login?error=timeout')
        }, 8000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
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