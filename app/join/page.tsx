'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Join() {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    async function handleJoin() {
        if (!code.trim()) return
        setLoading(true)
        setError('')
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            const res = await fetch('/api/invite/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.toUpperCase().trim(), user_id: user.id, email: user.email })
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

    return (
        <div style={{ minHeight: '100vh', background: '#080C14', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '440px' }}>
                {/* LOGO */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ width: '48px', height: '48px', background: '#7C3AED', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px' }}>🧠</div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '6px' }}>Join your team</h1>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>Enter the invite code from your company admin</p>
                </div>

                {/* CARD */}
                <div style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '16px', padding: '32px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>INVITE CODE</div>
                        <input
                            type="text"
                            placeholder="e.g. ABC123"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && handleJoin()}
                            maxLength={8}
                            style={{ width: '100%', background: '#080C14', border: '1px solid #1a2035', borderRadius: '10px', padding: '16px', color: '#fff', fontSize: '24px', fontFamily: 'monospace', fontWeight: '700', letterSpacing: '6px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    {error && (
                        <div style={{ background: '#450a0a', border: '1px solid #991b1b', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#f87171', textAlign: 'center' }}>
                            ❌ {error}
                        </div>
                    )}

                    <button onClick={handleJoin} disabled={loading || !code.trim()}
                        style={{ width: '100%', background: '#7C3AED', border: 'none', color: '#fff', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '600', opacity: !code.trim() ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                        {loading ? 'Joining...' : 'Join Team →'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                        <div style={{ flex: 1, height: '1px', background: '#1a2035' }} />
                        <span style={{ fontSize: '12px', color: '#374151' }}>or</span>
                        <div style={{ flex: 1, height: '1px', background: '#1a2035' }} />
                    </div>

                    <button onClick={() => router.push('/login')}
                        style={{ width: '100%', background: 'none', border: '1px solid #1a2035', color: '#6b7280', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
                        Create your own workspace →
                    </button>
                </div>

                <p style={{ textAlign: 'center', fontSize: '12px', color: '#374151', marginTop: '20px' }}>
                    Ask your company admin for an invite code
                </p>
            </div>
        </div>
    )
}