'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const industries = ['Technology / تكنولوجيا', 'Finance / مالية', 'Healthcare / رعاية صحية', 'Education / تعليم', 'Retail / تجزئة', 'Consulting / استشارات', 'Manufacturing / تصنيع', 'Other / أخرى']
const countries = [{ code: 'EG', name: 'Egypt 🇪🇬' }, { code: 'SA', name: 'Saudi Arabia 🇸🇦' }, { code: 'AE', name: 'UAE 🇦🇪' }, { code: 'US', name: 'United States 🇺🇸' }, { code: 'GB', name: 'United Kingdom 🇬🇧' }, { code: 'DE', name: 'Germany 🇩🇪' }, { code: 'FR', name: 'France 🇫🇷' }, { code: 'OTHER', name: 'Other' }]

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

    const totalSteps = accountType === 'individual' ? 2 : 3

    async function handleSubmit() {
        setLoading(true)
        setError('')
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            const name = accountType === 'individual' ? (user.email?.split('@')[0] || 'My Workspace') : companyName
            const res = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, email: user.email, company_name: name, industry: accountType === 'individual' ? 'Individual / فرد' : industry, country, language, company_size: accountType === 'individual' ? 'individual' : companySize })
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

    const canNext = () => {
        if (step === 1 && accountType === 'company' && !companyName) return false
        if (step === 2 && !country) return false
        return true
    }

    const s = {
        wrap: { minHeight: '100vh', background: '#080C14', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
        card: { width: '100%', maxWidth: '520px' },
        input: { width: '100%', background: '#0D1117', border: '1px solid #1a2035', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const },
        btn: { background: '#7C3AED', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', width: '100%' },
        btnOutline: { background: 'none', border: '1px solid #1a2035', color: '#9ca3af', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', flex: 1 },
    }

    return (
        <div style={s.wrap}>
            <div style={s.card}>
                {/* LOGO */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ width: '48px', height: '48px', background: '#7C3AED', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px' }}>🧠</div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '6px' }}>Set up your workspace</h1>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>Tell us about yourself to get started</p>
                </div>

                {/* PROGRESS */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < step ? '#7C3AED' : '#1a2035', transition: 'background 0.3s' }} />
                    ))}
                </div>

                {/* STEP 1 */}
                {step === 1 && (
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>How will you use MemoryOS?</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                            {[
                                { type: 'individual', icon: '👤', title: 'Individual', desc: 'Just me, personal workspace' },
                                { type: 'company', icon: '🏢', title: 'Company', desc: 'Team with multiple members' },
                            ].map(opt => (
                                <div key={opt.type} onClick={() => setAccountType(opt.type as any)}
                                    style={{ padding: '20px', borderRadius: '12px', border: `2px solid ${accountType === opt.type ? '#7C3AED' : '#1a2035'}`, background: accountType === opt.type ? '#1a0a2e' : '#0D1117', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{opt.icon}</div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: accountType === opt.type ? '#a78bfa' : '#fff' }}>{opt.title}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{opt.desc}</div>
                                </div>
                            ))}
                        </div>

                        {accountType === 'company' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Company Name *</div>
                                    <input placeholder="Acme Corp" value={companyName} onChange={e => setCompanyName(e.target.value)} style={s.input} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Industry</div>
                                    <select value={industry} onChange={e => setIndustry(e.target.value)} style={{ ...s.input, appearance: 'none' }}>
                                        <option value="">Select industry...</option>
                                        {industries.map(i => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Company Size</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                        {[{ key: 'startup', label: 'Startup', sub: '1-10' }, { key: 'small', label: 'Small', sub: '11-100' }, { key: 'enterprise', label: 'Enterprise', sub: '100+' }].map(sz => (
                                            <button key={sz.key} onClick={() => setCompanySize(sz.key)}
                                                style={{ padding: '10px', borderRadius: '8px', border: `2px solid ${companySize === sz.key ? '#7C3AED' : '#1a2035'}`, background: companySize === sz.key ? '#1a0a2e' : 'transparent', color: companySize === sz.key ? '#a78bfa' : '#6b7280', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                                {sz.label}<br /><span style={{ fontSize: '11px', opacity: 0.7 }}>{sz.sub}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '6px' }}>Where are you based?</h2>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>We'll use this to customize your experience</p>
                        <select value={country} onChange={e => setCountry(e.target.value)} style={{ ...s.input, appearance: 'none', marginBottom: '16px' }}>
                            <option value="">Select country...</option>
                            {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                        </select>
                    </div>
                )}

                {/* STEP 3 - Company only */}
                {step === 3 && accountType === 'company' && (
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '6px' }}>Preferred language</h2>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Choose the language for AI responses and the interface</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[{ key: 'en', flag: '🇬🇧', label: 'English', sub: 'For global teams' }, { key: 'ar', flag: '🇸🇦', label: 'العربية', sub: 'للفرق العربية' }].map(l => (
                                <div key={l.key} onClick={() => setLanguage(l.key)}
                                    style={{ padding: '24px', borderRadius: '12px', border: `2px solid ${language === l.key ? '#7C3AED' : '#1a2035'}`, background: language === l.key ? '#1a0a2e' : '#0D1117', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>{l.flag}</div>
                                    <div style={{ fontSize: '15px', fontWeight: '600', color: language === l.key ? '#a78bfa' : '#fff' }}>{l.label}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{l.sub}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '16px', textAlign: 'center' }}>{error}</p>}

                {/* NAVIGATION */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '32px' }}>
                    {step > 1 && (
                        <button onClick={() => setStep(s => s - 1)} style={s.btnOutline}>← Back</button>
                    )}
                    <button onClick={() => step < totalSteps ? setStep(s => s + 1) : handleSubmit()}
                        disabled={loading || !canNext()}
                        style={{ ...s.btn, flex: step > 1 ? 2 : 1, opacity: !canNext() ? 0.5 : 1 }}>
                        {loading ? 'Setting up...' : step < totalSteps ? 'Continue →' : '🚀 Get Started'}
                    </button>
                </div>

                <p style={{ textAlign: 'center', fontSize: '12px', color: '#374151', marginTop: '20px' }}>
                    Step {step} of {totalSteps}
                </p>
            </div>
        </div>
    )
}