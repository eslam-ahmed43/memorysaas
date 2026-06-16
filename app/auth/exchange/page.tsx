'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ExchangePage() {
    const router = useRouter()

    useEffect(() => {
        async function init() {
            setTimeout(async () => {
                const { data: { session } } = await supabase.auth.getSession()

                if (!session?.user) {
                    router.push('/login')
                    return
                }

                const res = await fetch(`/api/profile?user_id=${session.user.id}`)
                const data = await res.json()
                router.push(data.profile ? '/dashboard' : '/onboarding')
            }, 1000)
        }

        init()
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