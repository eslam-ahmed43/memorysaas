'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Join() {
    const [step, setStep] = useState(1)
    const [code, setCode] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    async function handleVerifyCode() {
        if (!code.trim()) return
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/invite/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.toUpperCase() })
            })
            const data = await res.json()
            if (data.error) { setError(data.error); return }
            setStep(2)
        } catch {
            setError('حدث خطأ')
        } finally {
            setLoading(false)
        }
    }

    async function handleJoin() {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/invite', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.toUpperCase(), email, password, full_name: fullName })
            })
            const data = await res.json()
            if (data.error) { setError(data.error); return }

            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
            if (signInError) { setError(signInError.message); return }

            router.push('/dashboard')
        } catch {
            setError('حدث خطأ')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">🧠 MemoryOS</h1>
                    <p className="text-gray-400">انضم لشركتك / Join your company</p>
                </div>

                <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                    <div className="flex gap-2 mb-8 justify-center">
                        {[1, 2].map(s => (
                            <div key={s} className={`w-16 h-2 rounded-full transition-all ${s <= step ? 'bg-purple-600' : 'bg-gray-700'}`} />
                        ))}
                    </div>

                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">كود الدعوة</h2>
                            <p className="text-gray-400 text-sm mb-6">أدخل الكود اللي وصلك من مديرك</p>
                            <input
                                type="text"
                                placeholder="مثال: ABC123"
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                className="w-full bg-gray-800 text-white text-center text-2xl font-mono rounded-lg px-4 py-4 mb-4 border border-gray-700 focus:outline-none focus:border-purple-500 tracking-widest"
                                maxLength={6}
                            />
                            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                            <button
                                onClick={handleVerifyCode}
                                disabled={loading || code.length < 6}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50"
                            >
                                {loading ? '...' : 'التحقق من الكود'}
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">إنشاء حسابك</h2>
                            <p className="text-gray-400 text-sm mb-6">الكود صحيح ✅ أكمل بياناتك</p>
                            <input
                                type="text"
                                placeholder="اسمك / Your name"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-3 border border-gray-700 focus:outline-none focus:border-purple-500"
                            />
                            <input
                                type="email"
                                placeholder="البريد الإلكتروني / Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-3 border border-gray-700 focus:outline-none focus:border-purple-500"
                            />
                            <input
                                type="password"
                                placeholder="كلمة المرور / Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-4 border border-gray-700 focus:outline-none focus:border-purple-500"
                            />
                            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setStep(1); setError('') }}
                                    className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-all"
                                >
                                    رجوع
                                </button>
                                <button
                                    onClick={handleJoin}
                                    disabled={loading || !email || !password}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50"
                                >
                                    {loading ? '...' : 'انضم الآن'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-gray-500 text-sm mt-6">
                    عندك حساب بالفعل؟{' '}
                    <a href="/" className="text-purple-400 hover:text-purple-300">تسجيل الدخول</a>
                </p>
            </div>
        </div>
    )
}