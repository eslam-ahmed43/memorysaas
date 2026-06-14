'use client'
import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ExchangeContent() {
    const router = useRouter()

    useEffect(() => {
        async function handleSession(userId: string) {
            const res = await fetch(`/api/profile?user_id=${userId}`)
            const data = await res.json()
            router.push(data.profile ? '/dashboard' : '/onboarding')
        }

        async function init() {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                handleSession(session.user.id)
                return
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (event, session) => {
                    if (session?.user) {
                        subscription.unsubscribe()
                        handleSession(session.user.id)
                    }
                }
            )

            setTimeout(() => {
                router.push('/login?error=timeout')
            }, 10000)
        }

        init()
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