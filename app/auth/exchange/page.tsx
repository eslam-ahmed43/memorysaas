'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Exchange() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        async function exchange() {
            const code = searchParams.get('code')
            if (!code) {
                router.push('/login')
                return
            }

            const { data, error } = await supabase.auth.exchangeCodeForSession(code)

            if (error || !data.user) {
                console.error('Exchange error:', error?.message)
                router.push('/login?error=auth')
                return
            }

            const res = await fetch(`/api/profile?user_id=${data.user.id}`)
            const profile = await res.json()

            if (profile.profile) {
                router.push('/dashboard')
            } else {
                router.push('/onboarding')
            }
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