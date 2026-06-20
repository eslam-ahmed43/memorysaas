'use client'
import { useRouter } from 'next/navigation'

export default function Landing() {
    const router = useRouter()

    return (
        <div style={{ minHeight: '100vh', background: '#080C14', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* NAV */}
            <nav style={{ borderBottom: '1px solid #1a2035', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', background: '#7C3AED', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🧠</div>
                    <span style={{ fontWeight: '700', fontSize: '18px', letterSpacing: '-0.3px' }}>MemoryOS</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => router.push('/login')}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px', padding: '8px 12px' }}>
                        Sign In
                    </button>
                    <button onClick={() => router.push('/login')}
                        style={{ background: '#7C3AED', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', padding: '10px 20px', borderRadius: '8px', fontWeight: '500' }}>
                        Get Started Free →
                    </button>
                </div>
            </nav>

            {/* HERO */}
            <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 32px 60px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '64px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1a1035', border: '1px solid #4C1D95', borderRadius: '100px', padding: '6px 16px', marginBottom: '32px' }}>
                        <div style={{ width: '6px', height: '6px', background: '#7C3AED', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '13px', color: '#a78bfa' }}>Decision Intelligence Platform</span>
                    </div>
                    <h1 style={{ fontSize: '64px', fontWeight: '800', lineHeight: '1.05', letterSpacing: '-2px', marginBottom: '24px', maxWidth: '800px' }}>
                        Your company's<br />
                        <span style={{ color: '#7C3AED' }}>intelligence layer</span>
                    </h1>
                    <p style={{ fontSize: '20px', color: '#6b7280', lineHeight: '1.6', maxWidth: '560px', marginBottom: '40px' }}>
                        MemoryOS turns documents, decisions, and company history into evidence-backed intelligence. Not a chatbot — a Decision OS.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button onClick={() => router.push('/login')}
                            style={{ background: '#7C3AED', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', padding: '14px 32px', borderRadius: '10px', fontWeight: '600' }}>
                            Start for free →
                        </button>
                        <button onClick={() => router.push('/join')}
                            style={{ background: 'none', border: '1px solid #1f2937', color: '#d1d5db', cursor: 'pointer', fontSize: '16px', padding: '14px 32px', borderRadius: '10px' }}>
                            Join with invite code
                        </button>
                    </div>
                </div>

                {/* PRODUCT MOCKUP */}
                <div style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '16px', padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }}></div>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }}></div>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }}></div>
                        <div style={{ flex: 1, background: '#1a2035', borderRadius: '4px', height: '12px', marginLeft: '8px' }}></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', minHeight: '320px' }}>
                        {/* Sidebar */}
                        <div style={{ background: '#080C14', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {['💬 Ask Memory', '🎯 Intelligence', '⚖️ Decisions', '🚨 Alerts', '📊 Briefing', '🔍 Root Cause'].map((item, i) => (
                                <div key={i} style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: i === 1 ? '#fff' : '#6b7280', background: i === 1 ? '#7C3AED' : 'none', cursor: 'pointer' }}>
                                    {item}
                                </div>
                            ))}
                        </div>
                        {/* Main content */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                {[
                                    { label: 'Knowledge', value: '73%', color: '#7C3AED' },
                                    { label: 'Team', value: '60%', color: '#0891b2' },
                                    { label: 'Activity', value: '85%', color: '#059669' },
                                    { label: 'Overall', value: '72%', color: '#d97706' },
                                ].map((s, i) => (
                                    <div key={i} style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ background: '#1a0a2e', border: '1px solid #4C1D95', borderRadius: '8px', padding: '14px' }}>
                                <div style={{ fontSize: '11px', color: '#a78bfa', marginBottom: '6px' }}>📋 Executive Summary</div>
                                <div style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.5' }}>CRM development decision shows medium risk with potential for sales improvement. Client Ahmed case resolved — recommend preventive SLA protocols.</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '8px', padding: '12px' }}>
                                    <div style={{ fontSize: '11px', color: '#ef4444', marginBottom: '6px' }}>⚠️ Active Risks</div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>CRM migration resistance · Budget overrun risk</div>
                                </div>
                                <div style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '8px', padding: '12px' }}>
                                    <div style={{ fontSize: '11px', color: '#10b981', marginBottom: '6px' }}>🚀 Opportunities</div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>CRM automation · Client retention improvement</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS */}
            <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px 80px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
                    {[
                        { number: '10x', label: 'Faster information retrieval' },
                        { number: '100%', label: 'Isolated per company' },
                        { number: '24/7', label: 'Always-on company memory' },
                    ].map((stat, i) => (
                        <div key={i} style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
                            <div style={{ fontSize: '32px', fontWeight: '800', color: '#7C3AED', marginBottom: '4px' }}>{stat.number}</div>
                            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FEATURES */}
            <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px 80px' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <h2 style={{ fontSize: '40px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '12px' }}>Not a chatbot. A Decision OS.</h2>
                    <p style={{ fontSize: '18px', color: '#6b7280' }}>Every answer is backed by evidence from your company's own data</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {[
                        { icon: '⚖️', title: 'Decision Graph', desc: 'Track the chain from decision → action → outcome with full evidence trail' },
                        { icon: '🔍', title: 'Root Cause Engine', desc: 'Ask "Why did X happen?" and get an evidence-backed analysis, not a guess' },
                        { icon: '🔄', title: 'What Changed Engine', desc: 'Automatically detect meaningful changes in your company before they escalate' },
                        { icon: '🎯', title: 'Executive Intelligence', desc: 'AI scores, risk radar, opportunities, and recommendations — all from your data' },
                        { icon: '📊', title: 'Weekly Briefing', desc: 'Sharp executive summary every week with priorities and focus areas' },
                        { icon: '🚨', title: 'Risk Alerts', desc: 'Proactive alerts surface hidden risks before they become expensive problems' },
                    ].map((f, i) => (
                        <div key={i} style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '12px', padding: '24px', transition: 'border-color 0.2s', cursor: 'default' }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = '#7C3AED')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a2035')}>
                            <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>{f.title}</h3>
                            <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section style={{ background: '#0D1117', borderTop: '1px solid #1a2035', borderBottom: '1px solid #1a2035', padding: '80px 32px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '40px', fontWeight: '800', textAlign: 'center', letterSpacing: '-1px', marginBottom: '56px' }}>Up and running in 4 steps</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                        {[
                            { step: '01', title: 'Create your workspace', desc: 'Sign up in 60 seconds with Google or Email' },
                            { step: '02', title: 'Upload your documents', desc: 'PDF, Word, Excel, code — any file type' },
                            { step: '03', title: 'Ask anything', desc: 'Get instant, evidence-backed answers from your data' },
                            { step: '04', title: 'Invite your team', desc: 'Send invite codes and set permissions per role' },
                        ].map((item, i) => (
                            <div key={i}>
                                <div style={{ fontSize: '48px', fontWeight: '900', color: '#1a2035', letterSpacing: '-2px', marginBottom: '12px' }}>{item.step}</div>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>{item.title}</h3>
                                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 32px' }}>
                <div style={{ background: '#0D1117', border: '1px solid #4C1D95', borderRadius: '20px', padding: '64px 32px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '16px' }}>
                        Ready to give your company<br />a decision memory?
                    </h2>
                    <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '40px' }}>Free to start. No credit card required.</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => router.push('/login')}
                            style={{ background: '#7C3AED', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', padding: '16px 40px', borderRadius: '10px', fontWeight: '600' }}>
                            Get started free →
                        </button>
                        <button onClick={() => router.push('/join')}
                            style={{ background: 'none', border: '1px solid #4C1D95', color: '#a78bfa', cursor: 'pointer', fontSize: '16px', padding: '16px 40px', borderRadius: '10px' }}>
                            Join with invite code
                        </button>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer style={{ borderTop: '1px solid #1a2035', padding: '32px', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', background: '#7C3AED', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🧠</div>
                    <span style={{ fontWeight: '700' }}>MemoryOS</span>
                    <span style={{ color: '#374151', fontSize: '14px' }}>— Decision Intelligence Platform</span>
                </div>
                <p style={{ color: '#374151', fontSize: '13px' }}>© 2026 MemoryOS. All rights reserved.</p>
            </footer>
        </div>
    )
}