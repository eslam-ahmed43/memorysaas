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
    'Consulting / استشارات',
    'Other / أخرى',
]

export default function Onboarding() {
    const [step, setStep] = useState(1)
    const [accountType, setAccountType] = useState<'company' | 'individual'>('company')
    const [companyName, setCompanyName] = useState('')
    const [industry, setIndustry] = useState('')
    const [country, setCountry] = useState('')
    const [language, setLanguage] = useState('en')
    const [companySize, setCompanySize] = useState('startup')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    async function handleSubmit() {
        setLoading(true)
        setError('')
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }

            const name = accountType === 'individual'
                ? (user.email?.split('@')[0] || 'My Workspace')
                : companyName

            const res = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    email: user.email,
                    company_name: name,
                    industry: accountType === 'individual' ? 'Individual / فرد' : industry,
                    country,
                    language,
                    company_size: accountType === 'individual' ? 'individual' : companySize,
                }),
            })
            const data = await res.json()
            if (data.error) { setError(data.error); return }
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const totalSteps = accountType === 'individual' ? 2 : 3

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">🧠 MemoryOS</h1>
                    <p className="text-gray-400">Let's set up your workspace</p>
                </div>

                <div className="flex gap-2 mb-8 justify-center">
                    {Array.from({ length: totalSteps }).map((_, s) => (
                        <div key={s} className={`h-2 rounded-full transition-all ${s < step ? 'w-10 bg-purple-600' : 'w-10 bg-gray-700'}`} />
                    ))}
                </div>

                <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">

                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-6">How will you use MemoryOS?</h2>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button onClick={() => setAccountType('individual')}
                                    className={`p-5 rounded-xl border-2 text-center transition-all ${accountType === 'individual' ? 'border-purple-600 bg-purple-600/10' : 'border-gray-700 hover:border-gray-500'}`}>
                                    <div className="text-3xl mb-2">👤</div>
                                    <div className="text-white font-medium text-sm">Individual</div>
                                    <div className="text-gray-400 text-xs mt-1">Just me, tracking my own work</div>
                                </button>
                                <button onClick={() => setAccountType('company')}
                                    className={`p-5 rounded-xl border-2 text-center transition-all ${accountType === 'company' ? 'border-purple-600 bg-purple-600/10' : 'border-gray-700 hover:border-gray-500'}`}>
                                    <div className="text-3xl mb-2">🏢</div>
                                    <div className="text-white font-medium text-sm">Company</div>
                                    <div className="text-gray-400 text-xs mt-1">Team with multiple members</div>
                                </button>
                            </div>

                            {accountType === 'company' && (
                                <>
                                    <input type="text" placeholder="Company Name" value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-3 border border-gray-700 focus:outline-none focus:border-purple-500" />
                                    <select value={industry} onChange={e => setIndustry(e.target.value)}
                                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-4 border border-gray-700 focus:outline-none focus:border-purple-500">
                                        <option value="">Select Industry</option>
                                        {industries.map(i => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { key: 'startup', label: '🚀 Startup', sub: '1-10' },
                                            { key: 'small', label: '🏢 Small', sub: '11-100' },
                                            { key: 'enterprise', label: '🏭 Enterprise', sub: '100+' },
                                        ].map(s => (
                                            <button key={s.key} onClick={() => setCompanySize(s.key)}
                                                className={`py-3 rounded-lg text-sm font-medium border transition-all ${companySize === s.key ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-700 text-gray-400 hover:border-purple-500'}`}>
                                                {s.label}<br /><span className="text-xs opacity-70">{s.sub}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-6">Where are you located?</h2>
                            <select value={country} onChange={e => setCountry(e.target.value)}
                                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500">
                                <option value="">Select Country</option>
                                {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    {step === 3 && accountType === 'company' && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-6">Preferred Language</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { key: 'en', flag: '🇬🇧', label: 'English', sub: 'الإنجليزية' },
                                    { key: 'ar', flag: '🇸🇦', label: 'العربية', sub: 'Arabic' },
                                ].map(l => (
                                    <button key={l.key} onClick={() => setLanguage(l.key)}
                                        className={`p-6 rounded-xl border-2 transition-all text-center ${language === l.key ? 'border-purple-600 bg-purple-600/10' : 'border-gray-700 hover:border-purple-500'}`}>
                                        <div className="text-3xl mb-2">{l.flag}</div>
                                        <div className="text-white font-medium">{l.label}</div>
                                        <div className="text-gray-400 text-sm">{l.sub}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

                    <div className="flex gap-3 mt-8">
                        {step > 1 && (
                            <button onClick={() => setStep(s => s - 1)}
                                className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-all">
                                ← Back
                            </button>
                        )}
                        <button
                            onClick={() => step < totalSteps ? setStep(s => s + 1) : handleSubmit()}
                            disabled={
                                loading ||
                                (step === 1 && accountType === 'company' && !companyName) ||
                                (step === 2 && !country)
                            }
                            className="flex-1 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all disabled:opacity-50">
                            {loading ? 'Setting up...' : step < totalSteps ? 'Next →' : 'Get Started 🚀'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}