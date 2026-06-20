'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { t } from '@/lib/translations'

export default function Dashboard() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [company, setCompany] = useState<any>(null)
    const [documents, setDocuments] = useState<any[]>([])
    const [conversations, setConversations] = useState<any[]>([])
    const [timeline, setTimeline] = useState<any[]>([])
    const [members, setMembers] = useState<any[]>([])
    const [inviteCodes, setInviteCodes] = useState<any[]>([])
    const [decisions, setDecisions] = useState<any[]>([])
    const [alerts, setAlerts] = useState<any[]>([])
    const [briefing, setBriefing] = useState<any>(null)
    const [loadingBriefing, setLoadingBriefing] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [question, setQuestion] = useState('')
    const [answer, setAnswer] = useState('')
    const [sources, setSources] = useState<any[]>([])
    const [asking, setAsking] = useState(false)
    const [activeTab, setActiveTab] = useState('chat')
    const [generatingCode, setGeneratingCode] = useState(false)
    const [newMemberRole, setNewMemberRole] = useState('employee')
    const [intelligence, setIntelligence] = useState<any>(null)
    const [loadingIntelligence, setLoadingIntelligence] = useState(false)
    const [lang, setLang] = useState<'ar' | 'en'>('en')
    const [newDecision, setNewDecision] = useState({ title: '', description: '' })
    const [addingDecision, setAddingDecision] = useState(false)
    const [rootCause, setRootCause] = useState<any>(null)
    const [rootCauseQuery, setRootCauseQuery] = useState('')
    const [loadingRootCause, setLoadingRootCause] = useState(false)
    const [whatChanged, setWhatChanged] = useState<any>(null)
    const [loadingWhatChanged, setLoadingWhatChanged] = useState(false)
    const router = useRouter()

    const isRTL = lang === 'ar'

    useEffect(() => { loadData() }, [])

    async function loadData() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUser(user)
        const res = await fetch(`/api/profile?user_id=${user.id}`)
        const data = await res.json()
        if (data.profile) {
            setProfile(data.profile)
            setCompany(data.company)
            setLang(data.company?.language === 'ar' ? 'ar' : 'en')
            loadDocuments(data.profile.company_id)
            loadConversations(data.profile.company_id)
            loadTimeline(data.profile.company_id)
            loadTeam(data.profile.company_id)
            loadDecisions(data.profile.company_id)
            loadAlerts(data.profile.company_id)
        }
    }

    async function loadDocuments(cid: string) {
        const res = await fetch(`/api/documents?company_id=${cid}`)
        const data = await res.json()
        if (data.documents) setDocuments(data.documents)
    }
    async function loadConversations(cid: string) {
        const res = await fetch(`/api/chat?company_id=${cid}`)
        const data = await res.json()
        if (data.conversations) setConversations(data.conversations)
    }
    async function loadTimeline(cid: string) {
        const res = await fetch(`/api/timeline?company_id=${cid}`)
        const data = await res.json()
        if (data.events) setTimeline(data.events)
    }
    async function loadTeam(cid: string) {
        const [m, c] = await Promise.all([fetch(`/api/team?company_id=${cid}`), fetch(`/api/invite?company_id=${cid}`)])
        const md = await m.json(); const cd = await c.json()
        if (md.members) setMembers(md.members)
        if (cd.codes) setInviteCodes(cd.codes)
    }
    async function loadDecisions(cid: string) {
        const res = await fetch(`/api/decisions?company_id=${cid}`)
        const data = await res.json()
        if (data.decisions) setDecisions(data.decisions)
    }
    async function loadAlerts(cid: string) {
        const res = await fetch(`/api/alerts?company_id=${cid}`)
        const data = await res.json()
        if (data.alerts) setAlerts(data.alerts)
    }
    async function loadIntelligence(force = false) {
        if (!profile) return
        setLoadingIntelligence(true)
        const res = await fetch('/api/intelligence', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: profile.company_id, force_refresh: force })
        })
        const data = await res.json()
        if (data.intelligence) setIntelligence(data.intelligence)
        setLoadingIntelligence(false)
    }
    async function loadBriefing() {
        if (!profile) return
        setLoadingBriefing(true)
        const res = await fetch('/api/briefing', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: profile.company_id })
        })
        const data = await res.json()
        if (data.briefing) setBriefing(data.briefing)
        setLoadingBriefing(false)
    }
    async function handleAddDecision() {
        if (!newDecision.title.trim() || !profile) return
        setAddingDecision(true)
        await fetch('/api/decisions', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: profile.company_id, title: newDecision.title, description: newDecision.description, made_by: user.id })
        })
        await loadDecisions(profile.company_id)
        await loadAlerts(profile.company_id)
        setNewDecision({ title: '', description: '' })
        setAddingDecision(false)
    }
    async function handleResolveAlert(id: string) {
        await fetch('/api/alerts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
        setAlerts(prev => prev.filter(a => a.id !== id))
    }
    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file || !profile) return
        setUploading(true)
        const fd = new FormData()
        fd.append('file', file); fd.append('company_id', profile.company_id); fd.append('user_id', user.id)
        await fetch('/api/documents', { method: 'POST', body: fd })
        await loadDocuments(profile.company_id)
        await loadTimeline(profile.company_id)
        setUploading(false)
    }
    async function handleAsk() {
        if (!question.trim() || !profile) return
        setAsking(true); setAnswer(''); setSources([])
        const res = await fetch('/api/chat', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, company_id: profile.company_id, user_id: user.id })
        })
        const data = await res.json()
        if (data.answer) { setAnswer(data.answer); setSources(data.sources || []); loadConversations(profile.company_id) }
        setAsking(false)
    }
    async function handleDelete(id: string) {
        if (!confirm('Are you sure?')) return
        const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) setDocuments(prev => prev.filter(d => d.id !== id))
    }
    async function handleGenerateInvite() {
        if (!profile) return
        setGeneratingCode(true)
        const res = await fetch('/api/invite', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: profile.company_id, role: newMemberRole, created_by: user.id })
        })
        await res.json()
        await loadTeam(profile.company_id)
        setGeneratingCode(false)
    }
    async function handleRootCause() {
        if (!rootCauseQuery.trim() || !profile) return
        setLoadingRootCause(true); setRootCause(null)
        const res = await fetch('/api/rootcause', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: profile.company_id, event: rootCauseQuery })
        })
        const data = await res.json()
        if (data.analysis) setRootCause(data.analysis)
        setLoadingRootCause(false)
    }
    async function loadWhatChanged() {
        if (!profile) return
        setLoadingWhatChanged(true)
        const res = await fetch('/api/whatchanged', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: profile.company_id })
        })
        const data = await res.json()
        if (data.analysis) setWhatChanged(data.analysis)
        setLoadingWhatChanged(false)
    }
    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const navItems = [
        { id: 'overview', icon: '⚡', label: lang === 'ar' ? 'نظرة عامة' : 'Overview' },
        { id: 'chat', icon: '💬', label: lang === 'ar' ? 'اسأل الذاكرة' : 'Ask Memory' },
        { id: 'intelligence', icon: '🎯', label: lang === 'ar' ? 'الذكاء التنفيذي' : 'Intelligence' },
        { id: 'briefing', icon: '📊', label: lang === 'ar' ? 'التقرير الأسبوعي' : 'Briefing' },
        { id: 'decisions', icon: '⚖️', label: lang === 'ar' ? 'القرارات' : 'Decisions' },
        { id: 'alerts', icon: '🚨', label: lang === 'ar' ? 'التنبيهات' : 'Alerts', badge: alerts.length },
        { id: 'rootcause', icon: '🔍', label: lang === 'ar' ? 'تحليل الأسباب' : 'Root Cause' },
        { id: 'whatchanged', icon: '🔄', label: lang === 'ar' ? 'ما الذي تغير' : 'What Changed' },
        { id: 'documents', icon: '📄', label: lang === 'ar' ? 'الوثائق' : 'Documents' },
        { id: 'timeline', icon: '📅', label: lang === 'ar' ? 'التايم لاين' : 'Timeline' },
        { id: 'team', icon: '👥', label: lang === 'ar' ? 'الفريق' : 'Team' },
    ]

    const s = {
        wrap: { display: 'flex', minHeight: '100vh', background: '#080C14', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif', direction: isRTL ? 'rtl' as const : 'ltr' as const },
        sidebar: { width: '220px', minHeight: '100vh', background: '#0D1117', borderRight: '1px solid #1a2035', display: 'flex', flexDirection: 'column' as const, flexShrink: 0 },
        logo: { padding: '20px 16px', borderBottom: '1px solid #1a2035', display: 'flex', alignItems: 'center', gap: '10px' },
        logoBox: { width: '32px', height: '32px', background: '#7C3AED', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' },
        nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column' as const, gap: '2px' },
        navItem: (active: boolean) => ({
            display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '13px', fontWeight: active ? '600' : '400',
            background: active ? '#1a0a2e' : 'transparent',
            color: active ? '#a78bfa' : '#6b7280',
            border: active ? '1px solid #4C1D95' : '1px solid transparent',
            transition: 'all 0.15s',
        }),
        main: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
        topbar: { background: '#0D1117', borderBottom: '1px solid #1a2035', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
        content: { flex: 1, padding: '24px', overflowY: 'auto' as const },
        card: { background: '#0D1117', border: '1px solid #1a2035', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
        stat: { background: '#0D1117', border: '1px solid #1a2035', borderRadius: '10px', padding: '16px' },
        input: { width: '100%', background: '#080C14', border: '1px solid #1a2035', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const },
        btn: { background: '#7C3AED', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
        btnOutline: { background: 'none', border: '1px solid #1a2035', color: '#9ca3af', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
        badge: (color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '600', background: color === 'green' ? '#052e16' : color === 'red' ? '#450a0a' : '#1c1917', color: color === 'green' ? '#4ade80' : color === 'red' ? '#f87171' : '#a8a29e', border: `1px solid ${color === 'green' ? '#166534' : color === 'red' ? '#991b1b' : '#44403c'}` }),
    }

    return (
        <div style={s.wrap}>
            {/* SIDEBAR */}
            <div style={s.sidebar}>
                <div style={s.logo}>
                    <div style={s.logoBox}>🧠</div>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '14px' }}>MemoryOS</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{company?.name}</div>
                    </div>
                </div>
                <div style={s.nav}>
                    {navItems.map(item => (
                        <div key={item.id} style={s.navItem(activeTab === item.id)}
                            onClick={() => {
                                setActiveTab(item.id)
                                if (item.id === 'intelligence' && !intelligence) loadIntelligence()
                            }}>
                            <span style={{ fontSize: '16px' }}>{item.icon}</span>
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {item.badge ? <span style={{ background: '#7C3AED', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '100px' }}>{item.badge}</span> : null}
                        </div>
                    ))}
                </div>
                <div style={{ padding: '12px 8px', borderTop: '1px solid #1a2035' }}>
                    <div style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', background: '#1a2035', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>👤</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name || user?.email?.split('@')[0]}</div>
                            <div style={{ fontSize: '10px', color: '#6b7280' }}>{profile?.role}</div>
                        </div>
                        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '11px' }}>↩</button>
                    </div>
                </div>
            </div>

            {/* MAIN */}
            <div style={s.main}>
                {/* TOPBAR */}
                <div style={s.topbar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{navItems.find(n => n.id === activeTab)?.icon}</span>
                        <span style={{ fontSize: '15px', fontWeight: '600' }}>{navItems.find(n => n.id === activeTab)?.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {[
                                { label: lang === 'ar' ? 'الوثائق' : 'Docs', value: documents.length, color: '#7C3AED' },
                                { label: lang === 'ar' ? 'القرارات' : 'Decisions', value: decisions.length, color: '#0891b2' },
                                { label: lang === 'ar' ? 'التنبيهات' : 'Alerts', value: alerts.length, color: alerts.length > 0 ? '#ef4444' : '#6b7280' },
                            ].map((stat, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: '700', color: stat.color }}>{stat.value}</span>
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div style={s.content}>

                    {activeTab === 'overview' && (
                        <div>
                            {/* WELCOME */}
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
                                    {lang === 'ar' ? `مرحباً، ${profile?.full_name?.split(' ')[0] || 'يا مدير'} 👋` : `Welcome back, ${profile?.full_name?.split(' ')[0] || 'there'} 👋`}
                                </h2>
                                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                                    {company?.name} · {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>

                            {/* KEY METRICS */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                                {[
                                    { icon: '📄', label: lang === 'ar' ? 'الوثائق' : 'Documents', value: documents.length, color: '#7C3AED', sub: lang === 'ar' ? 'ملف مرفوع' : 'files uploaded' },
                                    { icon: '⚖️', label: lang === 'ar' ? 'القرارات' : 'Decisions', value: decisions.length, color: '#0891b2', sub: lang === 'ar' ? 'قرار مسجل' : 'recorded' },
                                    { icon: '📅', label: lang === 'ar' ? 'الأحداث' : 'Events', value: timeline.length, color: '#059669', sub: lang === 'ar' ? 'حدث في التايم لاين' : 'in timeline' },
                                    { icon: '🚨', label: lang === 'ar' ? 'التنبيهات' : 'Alerts', value: alerts.length, color: alerts.length > 0 ? '#ef4444' : '#6b7280', sub: lang === 'ar' ? 'تنبيه نشط' : 'active' },
                                ].map((stat, i) => (
                                    <div key={i} style={{ background: '#0D1117', border: `1px solid ${stat.value > 0 && i === 3 ? '#450a0a' : '#1a2035'}`, borderRadius: '12px', padding: '20px' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
                                        <div style={{ fontSize: '32px', fontWeight: '800', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                {/* RECENT ALERTS */}
                                <div style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '12px', padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444' }}>🚨 {lang === 'ar' ? 'آخر التنبيهات' : 'Recent Alerts'}</span>
                                        <button onClick={() => setActiveTab('alerts')} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: '12px', cursor: 'pointer' }}>
                                            {lang === 'ar' ? 'عرض الكل ←' : 'View all →'}
                                        </button>
                                    </div>
                                    {alerts.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '13px' }}>✅ {lang === 'ar' ? 'لا توجد تنبيهات' : 'No active alerts'}</div>
                                    ) : alerts.slice(0, 3).map((a: any) => (
                                        <div key={a.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div style={{ width: '8px', height: '8px', background: a.severity === 'high' ? '#ef4444' : '#fbbf24', borderRadius: '50%', marginTop: '5px', flexShrink: 0 }}></div>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: '600' }}>{a.title}</div>
                                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{a.type}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* RECENT DECISIONS */}
                                <div style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '12px', padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#0891b2' }}>⚖️ {lang === 'ar' ? 'آخر القرارات' : 'Recent Decisions'}</span>
                                        <button onClick={() => setActiveTab('decisions')} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: '12px', cursor: 'pointer' }}>
                                            {lang === 'ar' ? 'عرض الكل ←' : 'View all →'}
                                        </button>
                                    </div>
                                    {decisions.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '13px' }}>⚖️ {lang === 'ar' ? 'لا توجد قرارات مسجلة' : 'No decisions yet'}</div>
                                    ) : decisions.slice(0, 3).map((d: any) => (
                                        <div key={d.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div style={{ width: '8px', height: '8px', background: '#0891b2', borderRadius: '50%', marginTop: '5px', flexShrink: 0 }}></div>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: '600' }}>{d.title}</div>
                                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{new Date(d.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* INTELLIGENCE QUICK VIEW */}
                            {intelligence ? (
                                <div style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '12px', padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#a78bfa' }}>🎯 {lang === 'ar' ? 'صحة الشركة' : 'Company Health'}</span>
                                        <button onClick={() => setActiveTab('intelligence')} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: '12px', cursor: 'pointer' }}>
                                            {lang === 'ar' ? 'تفاصيل ←' : 'Details →'}
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                        {[
                                            { label: lang === 'ar' ? 'المعرفة' : 'Knowledge', value: intelligence.scores?.knowledge_score || 0, color: '#7C3AED' },
                                            { label: lang === 'ar' ? 'الفريق' : 'Team', value: intelligence.scores?.team_score || 0, color: '#0891b2' },
                                            { label: lang === 'ar' ? 'النشاط' : 'Activity', value: intelligence.scores?.activity_score || 0, color: '#059669' },
                                            { label: lang === 'ar' ? 'الكلي' : 'Overall', value: intelligence.scores?.overall_score || 0, color: '#d97706' },
                                        ].map((sc, i) => (
                                            <div key={i} style={{ textAlign: 'center' }}>
                                                <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 8px' }}>
                                                    <svg viewBox="0 0 36 36" style={{ width: '64px', height: '64px', transform: 'rotate(-90deg)' }}>
                                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a2035" strokeWidth="3" />
                                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={sc.color} strokeWidth="3"
                                                            strokeDasharray={`${sc.value} 100`} strokeLinecap="round" />
                                                    </svg>
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: sc.color }}>{sc.value}%</div>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#6b7280' }}>{sc.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {intelligence.summary && (
                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1a2035', fontSize: '13px', color: '#9ca3af', lineHeight: '1.6' }}>
                                            {intelligence.summary.substring(0, 200)}...
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>{lang === 'ar' ? 'لم يتم تحليل الشركة بعد' : 'Company not analyzed yet'}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>{lang === 'ar' ? 'ارفع وثائق وشغّل التحليل التنفيذي' : 'Upload documents and run executive analysis'}</div>
                                    <button onClick={() => { setActiveTab('intelligence'); loadIntelligence() }} style={s.btn}>
                                        {lang === 'ar' ? 'تحليل الآن ←' : 'Analyze Now →'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CHAT */}
                    {activeTab === 'chat' && (
                        <div>
                            <div style={s.card}>
                                <textarea value={question} onChange={e => setQuestion(e.target.value)}
                                    placeholder={lang === 'ar' ? 'اسأل أي سؤال عن شركتك...' : 'Ask anything about your company...'}
                                    style={{ ...s.input, resize: 'none', minHeight: '100px', marginBottom: '12px' }} rows={4} />
                                <button onClick={handleAsk} disabled={asking} style={s.btn}>
                                    {asking ? '...' : lang === 'ar' ? 'اسأل ←' : 'Ask →'}
                                </button>
                            </div>
                            {answer && (
                                <div style={{ ...s.card, borderColor: '#4C1D95' }}>
                                    <div style={{ fontSize: '12px', color: '#a78bfa', marginBottom: '8px', fontWeight: '600' }}>
                                        {lang === 'ar' ? 'الإجابة' : 'Answer'}
                                    </div>
                                    <p style={{ fontSize: '14px', color: '#d1d5db', lineHeight: '1.7' }}>{answer}</p>
                                    {sources.length > 0 && (
                                        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #1a2035' }}>
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>{lang === 'ar' ? 'المصادر' : 'Sources'}</div>
                                            {sources.map((s: any, i: number) => (
                                                <div key={i} style={{ background: '#080C14', borderRadius: '6px', padding: '8px 12px', marginBottom: '6px', fontSize: '12px', color: '#9ca3af' }}>
                                                    <span style={{ color: '#7C3AED', fontWeight: '600' }}>{s.document_name}</span> — {s.content?.substring(0, 80)}...
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {conversations.length > 0 && (
                                <div style={s.card}>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', fontWeight: '600' }}>
                                        {lang === 'ar' ? 'المحادثات السابقة' : 'Previous conversations'}
                                    </div>
                                    {conversations.slice(0, 5).map((c: any) => (
                                        <div key={c.id} style={{ borderBottom: '1px solid #1a2035', paddingBottom: '12px', marginBottom: '12px' }}>
                                            <div style={{ fontSize: '13px', color: '#a78bfa', marginBottom: '4px' }}>Q: {c.question}</div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>A: {c.answer?.substring(0, 120)}...</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* INTELLIGENCE */}
                    {activeTab === 'intelligence' && (
                        <div>
                            {loadingIntelligence ? (
                                <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>🧠</div>
                                    <div style={{ color: '#a78bfa' }}>{lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}</div>
                                </div>
                            ) : intelligence ? (
                                <>
                                    {intelligence.scores && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                                            {[
                                                { label: lang === 'ar' ? 'المعرفة' : 'Knowledge', value: intelligence.scores.knowledge_score, color: '#7C3AED' },
                                                { label: lang === 'ar' ? 'الفريق' : 'Team', value: intelligence.scores.team_score, color: '#0891b2' },
                                                { label: lang === 'ar' ? 'النشاط' : 'Activity', value: intelligence.scores.activity_score, color: '#059669' },
                                                { label: lang === 'ar' ? 'الكلي' : 'Overall', value: intelligence.scores.overall_score, color: '#d97706' },
                                            ].map((sc, i) => (
                                                <div key={i} style={{ ...s.stat, textAlign: 'center' }}>
                                                    <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 12px' }}>
                                                        <svg viewBox="0 0 36 36" style={{ width: '80px', height: '80px', transform: 'rotate(-90deg)' }}>
                                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a2035" strokeWidth="2.5" />
                                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke={sc.color} strokeWidth="2.5"
                                                                strokeDasharray={`${sc.value} 100`} strokeLinecap="round" />
                                                        </svg>
                                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: sc.color }}>{sc.value}%</div>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{sc.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {intelligence.summary && (
                                        <div style={{ ...s.card, borderColor: '#4C1D95', background: '#0a0520' }}>
                                            <div style={{ fontSize: '12px', color: '#a78bfa', marginBottom: '8px', fontWeight: '600' }}>📋 {lang === 'ar' ? 'الملخص التنفيذي' : 'Executive Summary'}</div>
                                            <p style={{ fontSize: '14px', color: '#d1d5db', lineHeight: '1.7' }}>{intelligence.summary}</p>
                                        </div>
                                    )}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                        {intelligence.risks?.length > 0 && (
                                            <div style={s.card}>
                                                <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '12px', fontWeight: '600' }}>⚠️ {lang === 'ar' ? 'المخاطر' : 'Risks'} ({intelligence.risks.length})</div>
                                                {intelligence.risks.map((r: any, i: number) => (
                                                    <div key={i} style={{ background: '#1a0505', border: '1px solid #450a0a', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: '600' }}>{r.title}</span>
                                                            <span style={{ fontSize: '10px', color: r.severity === 'high' ? '#f87171' : r.severity === 'medium' ? '#fbbf24' : '#4ade80' }}>{r.severity}</span>
                                                        </div>
                                                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{r.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {intelligence.opportunities?.length > 0 && (
                                            <div style={s.card}>
                                                <div style={{ fontSize: '12px', color: '#4ade80', marginBottom: '12px', fontWeight: '600' }}>🚀 {lang === 'ar' ? 'الفرص' : 'Opportunities'} ({intelligence.opportunities.length})</div>
                                                {intelligence.opportunities.map((o: any, i: number) => (
                                                    <div key={i} style={{ background: '#052e16', border: '1px solid #166534', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#4ade80', marginBottom: '4px' }}>{o.title}</div>
                                                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{o.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {intelligence.recommendations?.length > 0 && (
                                        <div style={s.card}>
                                            <div style={{ fontSize: '12px', color: '#fbbf24', marginBottom: '12px', fontWeight: '600' }}>💡 {lang === 'ar' ? 'التوصيات' : 'Recommendations'}</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                {intelligence.recommendations.map((r: any, i: number) => (
                                                    <div key={i} style={{ background: '#080C14', border: '1px solid #1a2035', borderRadius: '8px', padding: '12px' }}>
                                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                                            <span>{r.priority === 'high' ? '🔴' : r.priority === 'medium' ? '🟡' : '🟢'}</span>
                                                            <span style={{ fontSize: '13px', fontWeight: '600' }}>{r.title}</span>
                                                        </div>
                                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{r.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <button onClick={() => loadIntelligence(true)} style={{ ...s.btnOutline, width: '100%', padding: '12px' }}>
                                        🔄 {lang === 'ar' ? 'تحديث التحليل' : 'Refresh Analysis'}
                                    </button>
                                </>
                            ) : (
                                <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎯</div>
                                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>{lang === 'ar' ? 'الذكاء التنفيذي' : 'Executive Intelligence'}</div>
                                    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>{lang === 'ar' ? 'ارفع وثائق للبدء' : 'Upload documents to get started'}</div>
                                    <button onClick={() => loadIntelligence(false)} style={s.btn}>{lang === 'ar' ? 'تحليل الآن' : 'Analyze Now'}</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* BRIEFING */}
                    {activeTab === 'briefing' && (
                        <div>
                            {loadingBriefing ? (
                                <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'pulse 2s infinite' }}>📊</div>
                                    <div style={{ color: '#a78bfa' }}>{lang === 'ar' ? 'جاري إنشاء التقرير...' : 'Generating briefing...'}</div>
                                </div>
                            ) : briefing ? (
                                <>
                                    <div style={{ ...s.card, borderColor: '#4C1D95', background: '#0a0520' }}>
                                        <div style={{ fontSize: '12px', color: '#a78bfa', marginBottom: '8px', fontWeight: '600' }}>📊 {lang === 'ar' ? 'التقرير الأسبوعي' : 'Weekly Briefing'}</div>
                                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>{briefing.headline}</p>
                                    </div>
                                    {briefing.top_priorities?.length > 0 && (
                                        <div style={s.card}>
                                            <div style={{ fontSize: '12px', color: '#fbbf24', marginBottom: '12px', fontWeight: '600' }}>🎯 {lang === 'ar' ? 'أولويات الأسبوع' : 'Top Priorities'}</div>
                                            {briefing.top_priorities.map((p: any, i: number) => (
                                                <div key={i} style={{ background: '#080C14', border: '1px solid #1a2035', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                                        <span>{p.urgency === 'high' ? '🔴' : p.urgency === 'medium' ? '🟡' : '🟢'}</span>
                                                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{p.title}</span>
                                                    </div>
                                                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{p.action}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {briefing.what_changed?.length > 0 && (
                                        <div style={s.card}>
                                            <div style={{ fontSize: '12px', color: '#0891b2', marginBottom: '12px', fontWeight: '600' }}>🔄 {lang === 'ar' ? 'ما الذي تغير؟' : 'What Changed?'}</div>
                                            {briefing.what_changed.map((c: string, i: number) => (
                                                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px', color: '#d1d5db' }}>
                                                    <span style={{ color: '#0891b2' }}>•</span><span>{c}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button onClick={loadBriefing} style={{ ...s.btnOutline, width: '100%', padding: '12px' }}>
                                        🔄 {lang === 'ar' ? 'إنشاء تقرير جديد' : 'Generate New Briefing'}
                                    </button>
                                </>
                            ) : (
                                <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
                                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>{lang === 'ar' ? 'التقرير الأسبوعي' : 'Weekly Briefing'}</div>
                                    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>{lang === 'ar' ? 'تقرير ذكي يلخص أسبوع شركتك' : 'AI summary of your company week'}</div>
                                    <button onClick={loadBriefing} style={s.btn}>{lang === 'ar' ? 'إنشاء التقرير' : 'Generate Briefing'}</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* DECISIONS */}
                    {activeTab === 'decisions' && (
                        <div>
                            {(profile?.role === 'owner' || profile?.role === 'dept_head') && (
                                <div style={s.card}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>⚖️ {lang === 'ar' ? 'تسجيل قرار جديد' : 'Record New Decision'}</div>
                                    <input type="text" placeholder={lang === 'ar' ? 'عنوان القرار...' : 'Decision title...'} value={newDecision.title}
                                        onChange={e => setNewDecision(p => ({ ...p, title: e.target.value }))}
                                        style={{ ...s.input, marginBottom: '10px' }} />
                                    <textarea placeholder={lang === 'ar' ? 'لماذا تم اتخاذ هذا القرار؟' : 'Why was this decision made?'} value={newDecision.description}
                                        onChange={e => setNewDecision(p => ({ ...p, description: e.target.value }))}
                                        style={{ ...s.input, resize: 'none', marginBottom: '10px' }} rows={3} />
                                    <button onClick={handleAddDecision} disabled={addingDecision || !newDecision.title} style={s.btn}>
                                        {addingDecision ? '...' : lang === 'ar' ? 'تسجيل القرار' : 'Record Decision'}
                                    </button>
                                </div>
                            )}
                            <div style={s.card}>
                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#6b7280' }}>
                                    {lang === 'ar' ? `القرارات (${decisions.length})` : `Decisions (${decisions.length})`}
                                </div>
                                {decisions.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '14px' }}>
                                        {lang === 'ar' ? 'لا توجد قرارات مسجلة بعد' : 'No decisions recorded yet'}
                                    </div>
                                ) : decisions.map((d: any) => (
                                    <div key={d.id} style={{ background: '#080C14', border: '1px solid #1a2035', borderRadius: '8px', padding: '14px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '600' }}>{d.title}</span>
                                            <span style={s.badge(d.status === 'active' ? 'green' : 'neutral')}>{d.status}</span>
                                        </div>
                                        {d.description && <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 6px' }}>{d.description}</p>}
                                        <div style={{ fontSize: '11px', color: '#374151' }}>{new Date(d.created_at).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ALERTS */}
                    {activeTab === 'alerts' && (
                        <div style={s.card}>
                            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '16px', color: '#ef4444' }}>
                                🚨 {lang === 'ar' ? `التنبيهات النشطة (${alerts.length})` : `Active Alerts (${alerts.length})`}
                            </div>
                            {alerts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
                                    <div style={{ color: '#6b7280', fontSize: '14px' }}>{lang === 'ar' ? 'لا توجد تنبيهات نشطة' : 'No active alerts'}</div>
                                </div>
                            ) : alerts.map((a: any) => (
                                <div key={a.id} style={{ background: '#1a0505', border: '1px solid #450a0a', borderRadius: '8px', padding: '14px', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <div>
                                            <span style={{ fontSize: '10px', color: '#9ca3af', display: 'block', marginBottom: '2px' }}>{a.type}</span>
                                            <span style={{ fontSize: '14px', fontWeight: '600' }}>{a.title}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                            <span style={s.badge(a.severity === 'high' ? 'red' : 'neutral')}>{a.severity}</span>
                                            {profile?.role === 'owner' && (
                                                <button onClick={() => handleResolveAlert(a.id)} style={s.btnOutline}>{lang === 'ar' ? 'حل' : 'Resolve'}</button>
                                            )}
                                        </div>
                                    </div>
                                    {a.description && <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{a.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ROOT CAUSE */}
                    {activeTab === 'rootcause' && (
                        <div>
                            <div style={s.card}>
                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>🔍 {lang === 'ar' ? 'محرك تحليل الأسباب الجذرية' : 'Root Cause Analysis Engine'}</div>
                                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>{lang === 'ar' ? 'اسأل: ليه حصلت كذا؟' : 'Ask: Why did X happen?'}</p>
                                <textarea value={rootCauseQuery} onChange={e => setRootCauseQuery(e.target.value)}
                                    placeholder={lang === 'ar' ? 'مثال: ليه نزلت المبيعات؟' : 'Example: Why did sales drop this month?'}
                                    style={{ ...s.input, resize: 'none', marginBottom: '10px' }} rows={3} />
                                <button onClick={handleRootCause} disabled={loadingRootCause || !rootCauseQuery.trim()} style={s.btn}>
                                    {loadingRootCause ? (lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...') : (lang === 'ar' ? 'حلل الأسباب' : 'Analyze')}
                                </button>
                            </div>
                            {rootCause && (
                                <>
                                    <div style={{ ...s.card, borderColor: '#450a0a', background: '#1a0505' }}>
                                        <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px', fontWeight: '600' }}>⚡ {lang === 'ar' ? 'السبب المباشر' : 'Immediate Cause'}</div>
                                        <p style={{ fontSize: '14px', color: '#d1d5db' }}>{rootCause.immediate_cause}</p>
                                    </div>
                                    {rootCause.root_causes?.length > 0 && (
                                        <div style={s.card}>
                                            <div style={{ fontSize: '12px', color: '#f97316', marginBottom: '12px', fontWeight: '600' }}>🌳 {lang === 'ar' ? 'الأسباب الجذرية' : 'Root Causes'}</div>
                                            {rootCause.root_causes.map((r: any, i: number) => (
                                                <div key={i} style={{ background: '#080C14', border: '1px solid #1a2035', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '10px', background: '#1c0a00', color: '#f97316', padding: '2px 8px', borderRadius: '4px' }}>{r.depth}</span>
                                                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{r.cause}</span>
                                                    </div>
                                                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{r.evidence}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {rootCause.chain_of_events?.length > 0 && (
                                        <div style={s.card}>
                                            <div style={{ fontSize: '12px', color: '#0891b2', marginBottom: '12px', fontWeight: '600' }}>🔗 {lang === 'ar' ? 'سلسلة الأحداث' : 'Chain of Events'}</div>
                                            {rootCause.chain_of_events.map((step: string, i: number) => (
                                                <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'flex-start' }}>
                                                    <div style={{ width: '22px', height: '22px', background: '#0891b2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>{i + 1}</div>
                                                    <p style={{ fontSize: '13px', color: '#d1d5db', margin: 0 }}>{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {rootCause.prevention_recommendations?.length > 0 && (
                                        <div style={s.card}>
                                            <div style={{ fontSize: '12px', color: '#4ade80', marginBottom: '12px', fontWeight: '600' }}>🛡️ {lang === 'ar' ? 'توصيات للوقاية' : 'Prevention Recommendations'}</div>
                                            {rootCause.prevention_recommendations.map((r: string, i: number) => (
                                                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                    <span style={{ color: '#4ade80' }}>✓</span>
                                                    <p style={{ fontSize: '13px', color: '#d1d5db', margin: 0 }}>{r}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* WHAT CHANGED */}
                    {activeTab === 'whatchanged' && (
                        <div>
                            {loadingWhatChanged ? (
                                <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔄</div>
                                    <div style={{ color: '#a78bfa' }}>{lang === 'ar' ? 'جاري تحليل التغييرات...' : 'Analyzing changes...'}</div>
                                </div>
                            ) : whatChanged ? (
                                <>
                                    <div style={{ ...s.card, borderColor: '#4C1D95', background: '#0a0520' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <div style={{ fontSize: '12px', color: '#a78bfa', fontWeight: '600' }}>🔄 {lang === 'ar' ? 'ملخص التغييرات' : 'Changes Summary'}</div>
                                            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                                                <span style={{ color: '#6b7280' }}>{lang === 'ar' ? 'السرعة:' : 'Velocity:'} <span style={{ color: whatChanged.change_velocity === 'high' ? '#ef4444' : whatChanged.change_velocity === 'medium' ? '#fbbf24' : '#4ade80', fontWeight: '600' }}>{whatChanged.change_velocity}</span></span>
                                                <span style={{ color: '#6b7280' }}>{lang === 'ar' ? 'الاستقرار:' : 'Stability:'} <span style={{ color: '#a78bfa', fontWeight: '600' }}>{whatChanged.stability_score}%</span></span>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#d1d5db', lineHeight: '1.7' }}>{whatChanged.summary}</p>
                                    </div>
                                    {whatChanged.significant_changes?.length > 0 && (
                                        <div style={s.card}>
                                            <div style={{ fontSize: '12px', color: '#0891b2', marginBottom: '12px', fontWeight: '600' }}>📌 {lang === 'ar' ? 'التغييرات المهمة' : 'Significant Changes'}</div>
                                            {whatChanged.significant_changes.map((c: any, i: number) => (
                                                <div key={i} style={{ background: '#080C14', border: '1px solid #1a2035', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                                        <span>{c.impact === 'positive' ? '✅' : c.impact === 'negative' ? '❌' : '➡️'}</span>
                                                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{c.title}</span>
                                                        <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: 'auto' }}>{c.area}</span>
                                                    </div>
                                                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{c.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {whatChanged.anomalies?.length > 0 && (
                                        <div style={s.card}>
                                            <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '12px', fontWeight: '600' }}>⚠️ {lang === 'ar' ? 'أنماط غير عادية' : 'Anomalies'}</div>
                                            {whatChanged.anomalies.map((a: any, i: number) => (
                                                <div key={i} style={{ background: '#1a0505', border: '1px solid #450a0a', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                                                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#f87171', marginBottom: '4px' }}>{a.anomaly}</p>
                                                    <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{a.explanation}</p>
                                                    <p style={{ fontSize: '12px', color: '#fbbf24', margin: 0 }}>→ {a.action_needed}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button onClick={loadWhatChanged} style={{ ...s.btnOutline, width: '100%', padding: '12px' }}>
                                        🔄 {lang === 'ar' ? 'تحديث التحليل' : 'Refresh Analysis'}
                                    </button>
                                </>
                            ) : (
                                <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔄</div>
                                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>{lang === 'ar' ? 'محرك التغييرات' : 'What Changed Engine'}</div>
                                    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>{lang === 'ar' ? 'يكتشف التغييرات المهمة تلقائياً' : 'Automatically detects meaningful changes'}</div>
                                    <button onClick={loadWhatChanged} style={s.btn}>{lang === 'ar' ? 'اكتشف التغييرات' : 'Detect Changes'}</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* DOCUMENTS */}
                    {activeTab === 'documents' && (
                        <div>
                            <div style={s.card}>
                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>📤 {lang === 'ar' ? 'رفع وثيقة' : 'Upload Document'}</div>
                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', border: '2px dashed #1a2035', borderRadius: '10px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#7C3AED')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a2035')}>
                                    {uploading ? (
                                        <div style={{ color: '#a78bfa', fontSize: '14px' }}>{lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</div>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
                                            <div style={{ fontSize: '13px', color: '#6b7280' }}>{lang === 'ar' ? 'اضغط لرفع ملف' : 'Click to upload'}</div>
                                            <div style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>PDF, DOCX, TXT, XLSX, CSV, Code</div>
                                        </>
                                    )}
                                    <input type="file" style={{ display: 'none' }} accept=".pdf,.docx,.txt,.xlsx,.csv,.py,.js,.ts,.tsx,.jsx,.cpp,.java,.html,.css" onChange={handleUpload} />
                                </label>
                            </div>
                            <div style={s.card}>
                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#6b7280' }}>
                                    {lang === 'ar' ? `الوثائق (${documents.length})` : `Documents (${documents.length})`}
                                </div>
                                {documents.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '14px' }}>
                                        {lang === 'ar' ? 'لا توجد وثائق بعد' : 'No documents yet'}
                                    </div>
                                ) : documents.map((doc: any) => (
                                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1a2035' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '20px' }}>📄</span>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: '600' }}>{doc.name}</div>
                                                <div style={{ fontSize: '11px', color: '#6b7280' }}>{new Date(doc.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={s.badge(doc.status === 'completed' ? 'green' : 'neutral')}>{doc.status}</span>
                                            <button onClick={() => handleDelete(doc.id)} style={{ ...s.btnOutline, color: '#ef4444', borderColor: '#450a0a' }}>✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TIMELINE */}
                    {activeTab === 'timeline' && (
                        <div style={s.card}>
                            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>📅 {lang === 'ar' ? 'تاريخ الشركة' : 'Company Timeline'}</div>
                            {timeline.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '14px' }}>
                                    {lang === 'ar' ? 'ارفع وثائق لاستخراج الأحداث تلقائياً' : 'Upload documents to auto-extract events'}
                                </div>
                            ) : (
                                <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #1a2035' }}>
                                    {timeline.map((event: any, i: number) => (
                                        <div key={event.id} style={{ position: 'relative', marginBottom: '24px' }}>
                                            <div style={{ position: 'absolute', left: '-33px', width: '18px', height: '18px', background: '#7C3AED', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' }}>{i + 1}</div>
                                            <div style={{ background: '#080C14', border: '1px solid #1a2035', borderRadius: '8px', padding: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{event.title}</span>
                                                    <span style={{ fontSize: '11px', color: '#7C3AED' }}>{new Date(event.event_date).toLocaleDateString()}</span>
                                                </div>
                                                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{event.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TEAM */}
                    {activeTab === 'team' && (
                        <div>
                            {profile?.role === 'owner' && (
                                <div style={s.card}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>➕ {lang === 'ar' ? 'دعوة عضو جديد' : 'Invite Member'}</div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <select value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)}
                                            style={{ ...s.input, width: 'auto' }}>
                                            <option value="employee">👤 {lang === 'ar' ? 'موظف' : 'Employee'}</option>
                                            <option value="dept_head">🏢 {lang === 'ar' ? 'مدير قسم' : 'Dept Head'}</option>
                                        </select>
                                        <button onClick={handleGenerateInvite} disabled={generatingCode} style={s.btn}>
                                            {generatingCode ? '...' : lang === 'ar' ? 'إنشاء كود' : 'Generate Code'}
                                        </button>
                                    </div>
                                    {inviteCodes.length > 0 && (
                                        <div style={{ marginTop: '16px' }}>
                                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{lang === 'ar' ? 'أكواد الدعوة:' : 'Invite Codes:'}</div>
                                            {inviteCodes.slice(0, 5).map((code: any) => (
                                                <div key={code.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080C14', border: '1px solid #1a2035', borderRadius: '8px', padding: '10px 14px', marginBottom: '6px' }}>
                                                    <div>
                                                        <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '700', color: '#a78bfa' }}>{code.code}</span>
                                                        <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '10px' }}>{code.role}</span>
                                                    </div>
                                                    <button onClick={() => navigator.clipboard.writeText(code.code)} style={s.btnOutline}>
                                                        {lang === 'ar' ? 'نسخ' : 'Copy'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div style={s.card}>
                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '16px', color: '#6b7280' }}>
                                    {lang === 'ar' ? `أعضاء الفريق (${members.length})` : `Team Members (${members.length})`}
                                </div>
                                {members.map((m: any) => (
                                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a2035' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <div style={{ width: '32px', height: '32px', background: '#1a2035', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                                                {m.role === 'owner' ? '👑' : m.role === 'dept_head' ? '🏢' : '👤'}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: '600' }}>{m.full_name}</div>
                                                <div style={{ fontSize: '11px', color: '#6b7280' }}>{m.role}</div>
                                            </div>
                                        </div>
                                        {profile?.role === 'owner' && m.id !== user?.id && (
                                            <button onClick={async () => {
                                                if (!confirm('Remove member?')) return
                                                await fetch('/api/team', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: m.id }) })
                                                setMembers(prev => prev.filter(x => x.id !== m.id))
                                            }} style={{ ...s.btnOutline, color: '#ef4444', borderColor: '#450a0a' }}>
                                                {lang === 'ar' ? 'إزالة' : 'Remove'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}