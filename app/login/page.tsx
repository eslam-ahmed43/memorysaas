'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Mode = 'choice' | 'google' | 'otp_email' | 'otp_verify'

export default function LoginPage() {
    const [mode, setMode] = useState<Mode>('choice')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState('')
    const [info, setInfo] = useState('')
    const router = useRouter()

    async function handleGoogleLogin() {
        setGoogleLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `https://memorysaas-qjg3.vercel.app/auth/exchange`,
            }
        })
        if (error) setError(error.message)
        setGoogleLoading(false)
    }

    async function handleSendOTP() {
        if (!email.trim()) { setError('Enter your email'); return }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) { setError('Invalid email address'); return }
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithOtp({
            email: email.toLowerCase().trim(),
            options: { shouldCreateUser: true }
        })
        if (error) {
            setError(error.message)
        } else {
            setInfo(`OTP sent to ${email}`)
            setMode('otp_verify')
        }
        setLoading(false)
    }

    async function handleVerifyOTP() {
        if (!otp.trim() || otp.length < 6) { setError('Enter the 6-digit OTP'); return }
        setLoading(true)
        setError('')
        const { data, error } = await supabase.auth.verifyOtp({
            email: email.toLowerCase().trim(),
            token: otp.trim(),
            type: 'email'
        })
        if (error) {
            setError('Invalid or expired OTP')
            setLoading(false)
            return
        }
        if (data.user) {
            const res = await fetch(`/api/profile?user_id=${data.user.id}`)
            const profile = await res.json()
            router.push(profile.profile ? '/dashboard' : '/onboarding')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">🧠 MemoryOS</h1>
                    <p className="text-gray-400">Your Company's Decision Intelligence Platform</p>
                </div>

                <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                    {mode === 'choice' && (
                        <div className="space-y-4">
                            <button onClick={handleGoogleLogin} disabled={googleLoading}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 rounded-lg transition-all disabled:opacity-50">
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {googleLoading ? 'Loading...' : 'Continue with Google'}
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-gray-700" />
                                <span className="text-gray-500 text-sm">or</span>
                                <div className="flex-1 h-px bg-gray-700" />
                            </div>

                            <button onClick={() => setMode('otp_email')}
                                className="w-full flex items-center justify-center gap-2 border border-gray-700 hover:border-purple-500 text-gray-300 hover:text-white font-medium py-3 rounded-lg transition-all">
                                ✉️ Continue with Email OTP
                            </button>

                            <p className="text-center text-gray-500 text-xs mt-4">
                                By signing in, you agree to our Terms of Service
                            </p>
                        </div>
                    )}

                    {mode === 'otp_email' && (
                        <div>
                            <button onClick={() => { setMode('choice'); setError('') }}
                                className="text-gray-500 hover:text-white text-sm mb-6 flex items-center gap-1">
                                ← Back
                            </button>
                            <h2 className="text-xl font-bold text-white mb-2">Enter your email</h2>
                            <p className="text-gray-400 text-sm mb-6">We'll send you a one-time password</p>
                            <input type="email" placeholder="your@email.com" value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-4 border border-gray-700 focus:outline-none focus:border-purple-500" />
                            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                            <button onClick={handleSendOTP} disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50">
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </div>
                    )}

                    {mode === 'otp_verify' && (
                        <div>
                            <button onClick={() => { setMode('otp_email'); setError(''); setOtp('') }}
                                className="text-gray-500 hover:text-white text-sm mb-6 flex items-center gap-1">
                                ← Back
                            </button>
                            <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
                            {info && <p className="text-green-400 text-sm mb-4">✅ {info}</p>}
                            <p className="text-gray-400 text-sm mb-6">Enter the 6-digit code sent to <span className="text-purple-400">{email}</span></p>
                            <input type="text" placeholder="000000" value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                                className="w-full bg-gray-800 text-white text-center text-3xl font-mono tracking-widest rounded-lg px-4 py-4 mb-4 border border-gray-700 focus:outline-none focus:border-purple-500"
                                maxLength={6} />
                            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                            <button onClick={handleVerifyOTP} disabled={loading || otp.length < 6}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50">
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                            <button onClick={handleSendOTP} disabled={loading}
                                className="w-full text-gray-500 hover:text-white text-sm mt-3 transition-colors">
                                Resend OTP
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-gray-600 text-xs mt-6">
                    Have an invite code?{' '}
                    <a href="/join" className="text-purple-400 hover:text-purple-300">Join your company</a>
                </p>
            </div>
        </div>
    )
}