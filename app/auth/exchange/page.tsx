'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ExchangePage() {
    const router = useRouter()

    useEffect(() => {
        async function handleSession(userId: string) {
            const res = await fetch(`/api/profile?user_id=${userId}`)
            const data = await res.json()
            router.push(data.profile ? '/dashboard' : '/onboarding')
        }

        // Check if already signed in
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                handleSession(session.user.id)
            }
        })

        // Listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    subscription.unsubscribe()
                    handleSession(session.user.id)
                }
            }
        )

        // Timeout fallback
        const timeout = setTimeout(() => {
            router.push('/login?error=timeout')
        }, 10000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
    }, [router])

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center">
                <div className="text-4xl mb-4 animate-pulse">🧠</div>
                <p className="text-white text-lg">Signing you in...</p>
            </div>
        </div>
    )
}