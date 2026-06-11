'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const countries = [
    { code: 'EG', name: 'Egypt / مصر' },
    { code: 'SA', name: 'Saudi Arabia / السعودية' },
    { code: 'AE', name: 'UAE / الإمارات' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'OTHER', name: 'Other / أخرى' },
]

const industries = [
    'Technology / تكنولوجيا',
    'Finance / مالية',
    'Healthcare / رعاية صحية',
    'Education / تعليم',
    'Retail / تجزئة',
    'Manufacturing / تصنيع',
    'Other / أخرى',
]

export default function Onboarding() {
    const [step, setStep] = useState(1)
    const [companyName, setCompanyName] = useState('')
    const [industry, setIndustry] = useState('')
    const [country, setCountry] = useState('')
    const [language, setLanguage] = useState('ar')
    const [companySize, setCompanySize] = useState('startup')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    async function handleSubmit() {
        setLoading(true)
        setError('')
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/'); return }

            const res = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    email: user.email,
                    company_name: companyName,
                    industry,
                    country,
                    language,
                    company_size: companySize,
                }),
            })
            const data = await res.json()
            if (data.error) { setError(data.error); return }
            router.push('/dashboard')
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">🧠 MemoryOS</h1>
                    <p className="text-gray-400">Let's set up your company / هنجهز شركتك</p>
                </div>

                <div className="flex gap-2 mb-8 justify-center">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`w-10 h-2 rounded-full transition-all ${s <= step ? 'bg-purple-600' : 'bg-gray-700'}`} />
                    ))}
                </div>

                <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">

                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-6">Company Info / معلومات الشركة</h2>
                            <input
                                type="text"
                                placeholder="Company Name / اسم الشركة"
                                value={companyName}
                                onChange={e => setCompanyName(e.target.value)}
                                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-4 border border-gray-700 focus:outline-none focus:border-purple-500"
                            />
                            <select
                                value={industry}
                                onChange={e => setIndustry(e.target.value)}
                                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-4 border border-gray-700 focus:outline-none focus:border-purple-500"
                            >
                                <option value="">Select Industry / اختار المجال</option>
                                {industries.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                            <div className="grid grid-cols-3 gap-3">
                                {['startup', 'small', 'enterprise'].map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setCompanySize(size)}
                                        className={`py-3 rounded-lg text-sm font-medium border transition-all ${companySize === size ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-700 text-gray-400 hover:border-purple-500'}`}
                                    >
                                        {size === 'startup' ? '🚀 Startup\n1-10' : size === 'small' ? '🏢 Small\n11-100' : '🏭 Enterprise\n100+'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-6">Location / الموقع</h2>
                            <select
                                value={country}
                                onChange={e => setCountry(e.target.value)}
                                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-4 border border-gray-700 focus:outline-none focus:border-purple-500"
                            >
                                <option value="">Select Country / اختار الدولة</option>
                                {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-6">Language / اللغة</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setLanguage('ar')}
                                    className={`p-6 rounded-xl border-2 transition-all text-center ${language === 'ar' ? 'border-purple-600 bg-purple-600/10' : 'border-gray-700 hover:border-purple-500'}`}
                                >
                                    <div className="text-3xl mb-2">🇸🇦</div>
                                    <div className="text-white font-medium">العربية</div>
                                    <div className="text-gray-400 text-sm">Arabic</div>
                                </button>
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`p-6 rounded-xl border-2 transition-all text-center ${language === 'en' ? 'border-purple-600 bg-purple-600/10' : 'border-gray-700 hover:border-purple-500'}`}
                                >
                                    <div className="text-3xl mb-2">🇬🇧</div>
                                    <div className="text-white font-medium">English</div>
                                    <div className="text-gray-400 text-sm">الإنجليزية</div>
                                </button>
                            </div>
                        </div>
                    )}

                    {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}

                    <div className="flex gap-3 mt-8">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-all"
                            >
                                Back / رجوع
                            </button>
                        )}
                        <button
                            onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()}
                            disabled={loading || (step === 1 && !companyName) || (step === 2 && !country)}
                            className="flex-1 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all disabled:opacity-50"
                        >
                            {loading ? '...' : step < 3 ? 'Next / التالي' : 'Get Started / ابدأ'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}