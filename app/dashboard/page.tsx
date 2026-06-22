'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
    const [kpis, setKpis] = useState<any[]>([])
    const [briefing, setBriefing] = useState<any>(null)
    const [loadingBriefing, setLoadingBriefing] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [question, setQuestion] = useState('')
    const [answer, setAnswer] = useState('')
    const [sources, setSources] = useState<any[]>([])
    const [asking, setAsking] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')
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
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null)
    const [newKpi, setNewKpi] = useState({ name: '', value: '', previous_value: '', unit: '' })
    const [addingKpi, setAddingKpi] = useState(false)
    const [docSearch, setDocSearch] = useState('')
    const [companyEdit, setCompanyEdit] = useState({ name: '', industry: '', language: '', country: '' })
    const [savingCompany, setSavingCompany] = useState(false)
    const [showAlertsDropdown, setShowAlertsDropdown] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const router = useRouter()

    const isRTL = lang === 'ar'
    const mobile = mounted && isMobile

    useEffect(() => { loadData() }, [])

    useEffect(() => {
        const check = () => {
            setIsMobile(window.innerWidth < 768)
            setMounted(true)
        }
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            const target = e.target as HTMLElement
            if (!target.closest('[data-bell]')) setShowAlertsDropdown(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

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
            setCompanyEdit({ name: data.company?.name || '', industry: data.company?.industry || '', language: data.company?.language || 'en', country: data.company?.country || '' })
            loadDocuments(data.profile.company_id)
            loadConversations(data.profile.company_id)
            loadTimeline(data.profile.company_id)
            loadTeam(data.profile.company_id)
            loadDecisions(data.profile.company_id)
            loadAlerts(data.profile.company_id)
            loadKpis(data.profile.company_id)
        }
    }

    async function loadDocuments(cid: string) { const r = await fetch(`/api/documents?company_id=${cid}`); const d = await r.json(); if (d.documents) setDocuments(d.documents) }
    async function loadConversations(cid: string) { const r = await fetch(`/api/chat?company_id=${cid}`); const d = await r.json(); if (d.conversations) setConversations(d.conversations) }
    async function loadTimeline(cid: string) { const r = await fetch(`/api/timeline?company_id=${cid}`); const d = await r.json(); if (d.events) setTimeline(d.events) }
    async function loadTeam(cid: string) {
        const [m, c] = await Promise.all([fetch(`/api/team?company_id=${cid}`), fetch(`/api/invite?company_id=${cid}`)])
        const md = await m.json(); const cd = await c.json()
        if (md.members) setMembers(md.members)
        if (cd.codes) setInviteCodes(cd.codes)
    }
    async function loadDecisions(cid: string) { const r = await fetch(`/api/decisions?company_id=${cid}`); const d = await r.json(); if (d.decisions) setDecisions(d.decisions) }
    async function loadAlerts(cid: string) { const r = await fetch(`/api/alerts?company_id=${cid}`); const d = await r.json(); if (d.alerts) setAlerts(d.alerts) }
    async function loadKpis(cid: string) { const r = await fetch(`/api/kpis?company_id=${cid}`); const d = await r.json(); if (d.kpis) setKpis(d.kpis) }

    async function loadIntelligence(force = false) {
        if (!profile) return
        setLoadingIntelligence(true)
        const res = await fetch('/api/intelligence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: profile.company_id, force_refresh: force }) })
        const data = await res.json()
        if (data.intelligence) setIntelligence(data.intelligence)
        setLoadingIntelligence(false)
    }

    async function loadBriefing() {
        if (!profile) return
        setLoadingBriefing(true)
        const res = await fetch('/api/briefing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: profile.company_id }) })
        const data = await res.json()
        if (data.briefing) setBriefing(data.briefing)
        setLoadingBriefing(false)
    }

    async function handleAddDecision() {
        if (!newDecision.title.trim() || !profile) return
        setAddingDecision(true)
        await fetch('/api/decisions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: profile.company_id, title: newDecision.title, description: newDecision.description, made_by: user.id }) })
        await loadDecisions(profile.company_id)
        await loadAlerts(profile.company_id)
        setNewDecision({ title: '', description: '' })
        showToast(lang === 'ar' ? 'تم تسجيل القرار!' : 'Decision recorded!')
        setAddingDecision(false)
    }

    async function handleResolveAlert(id: string) {
        await fetch('/api/alerts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
        setAlerts(prev => prev.filter(a => a.id !== id))
        showToast(lang === 'ar' ? 'تم حل التنبيه!' : 'Alert resolved!')
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
        showToast(lang === 'ar' ? 'تم رفع الملف!' : 'Document uploaded!')
        setUploading(false)
    }

    async function handleAsk() {
        if (!question.trim() || !profile) return
        setAsking(true); setAnswer(''); setSources([])
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, company_id: profile.company_id, user_id: user.id }) })
        const data = await res.json()
        if (data.answer) { setAnswer(data.answer); setSources(data.sources || []); loadConversations(profile.company_id) }
        setAsking(false)
    }

    async function handleDelete(id: string) {
        if (!confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return
        const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) { setDocuments(prev => prev.filter(d => d.id !== id)); showToast(lang === 'ar' ? 'تم الحذف!' : 'Deleted!', 'info') }
    }

    async function handleGenerateInvite() {
        if (!profile) return
        setGeneratingCode(true)
        await fetch('/api/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: profile.company_id, role: newMemberRole, created_by: user.id }) })
        await loadTeam(profile.company_id)
        showToast(lang === 'ar' ? 'تم إنشاء الكود!' : 'Code generated!')
        setGeneratingCode(false)
    }

    async function handleRootCause() {
        if (!rootCauseQuery.trim() || !profile) return
        setLoadingRootCause(true); setRootCause(null)
        const res = await fetch('/api/rootcause', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: profile.company_id, event: rootCauseQuery }) })
        const data = await res.json()
        if (data.analysis) setRootCause(data.analysis)
        setLoadingRootCause(false)
    }

    async function loadWhatChanged() {
        if (!profile) return
        setLoadingWhatChanged(true)
        const res = await fetch('/api/whatchanged', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: profile.company_id }) })
        const data = await res.json()
        if (data.analysis) setWhatChanged(data.analysis)
        setLoadingWhatChanged(false)
    }

    async function handleAddKpi() {
        if (!newKpi.name || !newKpi.value || !profile) return
        setAddingKpi(true)
        const res = await fetch('/api/kpis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: profile.company_id, name: newKpi.name, value: parseFloat(newKpi.value), previous_value: newKpi.previous_value ? parseFloat(newKpi.previous_value) : null, unit: newKpi.unit }) })
        const data = await res.json()
        if (data.success) { await loadKpis(profile.company_id); setNewKpi({ name: '', value: '', previous_value: '', unit: '' }); showToast(lang === 'ar' ? 'تم إضافة المؤشر!' : 'KPI added!') }
        setAddingKpi(false)
    }

    async function handleDeleteKpi(id: string) {
        await fetch(`/api/kpis?id=${id}`, { method: 'DELETE' })
        setKpis(prev => prev.filter(k => k.id !== id))
        showToast(lang === 'ar' ? 'تم الحذف' : 'Deleted', 'info')
    }

    async function handleSaveCompany() {
        if (!profile) return
        setSavingCompany(true)
        const res = await fetch('/api/company', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: profile.company_id, ...companyEdit }) })
        const data = await res.json()
        if (data.success) { setCompany(data.company); setLang(data.company.language === 'ar' ? 'ar' : 'en'); showToast(lang === 'ar' ? 'تم الحفظ!' : 'Saved!') }
        else showToast(lang === 'ar' ? 'حدث خطأ' : 'Error', 'error')
        setSavingCompany(false)
    }

    async function handleLogout() { await supabase.auth.signOut(); router.push('/login') }

    function handleNavClick(id: string) {
        setActiveTab(id)
        if (id === 'intelligence' && !intelligence) loadIntelligence()
        if (mobile) setSidebarOpen(false)
    }

    const navItems = [
        { id: 'overview', icon: '⚡', label: lang === 'ar' ? 'نظرة عامة' : 'Overview' },
        { id: 'chat', icon: '💬', label: lang === 'ar' ? 'اسأل الذاكرة' : 'Ask Memory' },
        { id: 'intelligence', icon: '🎯', label: lang === 'ar' ? 'الذكاء التنفيذي' : 'Intelligence' },
        { id: 'briefing', icon: '📊', label: lang === 'ar' ? 'التقرير الأسبوعي' : 'Briefing' },
        { id: 'decisions', icon: '⚖️', label: lang === 'ar' ? 'القرارات' : 'Decisions' },
        { id: 'alerts', icon: '🚨', label: lang === 'ar' ? 'التنبيهات' : 'Alerts' },
        { id: 'rootcause', icon: '🔍', label: lang === 'ar' ? 'تحليل الأسباب' : 'Root Cause' },
        { id: 'whatchanged', icon: '🔄', label: lang === 'ar' ? 'ما الذي تغير' : 'What Changed' },
        { id: 'kpis', icon: '📈', label: lang === 'ar' ? 'المؤشرات' : 'KPIs' },
        { id: 'documents', icon: '📄', label: lang === 'ar' ? 'الوثائق' : 'Documents' },
        { id: 'timeline', icon: '📅', label: lang === 'ar' ? 'التايم لاين' : 'Timeline' },
        { id: 'team', icon: '👥', label: lang === 'ar' ? 'الفريق' : 'Team' },
        { id: 'settings', icon: '⚙️', label: lang === 'ar' ? 'الإعدادات' : 'Settings' },
    ]

    const s = {
        wrap: { display: 'flex', minHeight: '100vh', background: '#080C14', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif', direction: isRTL ? 'rtl' as const : 'ltr' as const },
        sidebar: {
            width: '220px', background: '#0D1117', borderRight: '1px solid #1a2035',
            display: 'flex', flexDirection: 'column' as const, flexShrink: 0,
            ...(mobile ? {
                position: 'fixed' as const, top: 0,
                left: isRTL ? 'auto' : 0, right: isRTL ? 0 : 'auto',
                height: '100vh', zIndex: 100,
                transform: sidebarOpen ? 'translateX(0)' : (isRTL ? 'translateX(100%)' : 'translateX(-100%)'),
                transition: 'transform 0.25s ease',
            } : { minHeight: '100vh' })
        },
        nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column' as const, gap: '2px', overflowY: 'auto' as const },
        navItem: (active: boolean) => ({ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '600' : '400', background: active ? '#1a0a2e' : 'transparent', color: active ? '#a78bfa' : '#6b7280', border: active ? '1px solid #4C1D95' : '1px solid transparent', transition: 'all 0.15s' }),
        main: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', minWidth: 0 },
        topbar: { background: '#0D1117', borderBottom: '1px solid #1a2035', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
        content: { flex: 1, padding: mobile ? '16px' : '24px', overflowY: 'auto' as const },
        card: { background: '#0D1117', border: '1px solid #1a2035', borderRadius: '12px', padding: mobile ? '16px' : '20px', marginBottom: '16px' },
        stat: { background: '#0D1117', border: '1px solid #1a2035', borderRadius: '10px', padding: '16px' },
        input: { width: '100%', background: '#080C14', border: '1px solid #1a2035', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const },
        btn: { background: '#7C3AED', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
        btnOutline: { background: 'none', border: '1px solid #1a2035', color: '#9ca3af', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
        badge: (color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '600', background: color === 'green' ? '#052e16' : color === 'red' ? '#450a0a' : '#1c1917', color: color === 'green' ? '#4ade80' : color === 'red' ? '#f87171' : '#a8a29e', border: `1px solid ${color === 'green' ? '#166534' : color === 'red' ? '#991b1b' : '#44403c'}` }),
    }

    const filteredDocs = documents.filter(d => d.name.toLowerCase().includes(docSearch.toLowerCase()))

    const ScoreCircle = ({ value, color, size = 80 }: { value: number, color: string, size?: number }) => (
        <div style={{ position: 'relative', width: size, height: size, margin: '0 auto 8px' }}>
            <svg viewBox="0 0 36 36" style={{ width: size, height: size, transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a2035" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray={`${value} 100`} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size > 70 ? '16px' : '13px', fontWeight: '800', color }}>{value}%</div>
        </div>
    )

    return (
        <div style={s.wrap}>
            {mobile && sidebarOpen && (
                <div onClick={() => setSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99 }} />
            )}

            {/* SIDEBAR */}
            <div style={s.sidebar}>
                <div style={{ padding: '16px', borderBottom: '1px solid #1a2035', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', background: '#7C3AED', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🧠</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '14px' }}>MemoryOS</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company?.name}</div>
                    </div>
                    {mobile && (
                        <button onClick={() => setSidebarOpen(false)}
                            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '20px', padding: '4px', flexShrink: 0 }}>✕</button>
                    )}
                </div>
                <div style={s.nav}>
                    {navItems.map(item => (
                        <div key={item.id} style={s.navItem(activeTab === item.id)} onClick={() => handleNavClick(item.id)}>
                            <span style={{ fontSize: '15px' }}>{item.icon}</span>
                            <span style={{ flex: 1 }}>{item.label}</span>
                        </div>
                    ))}
                </div>
                <div style={{ padding: '12px 8px', borderTop: '1px solid #1a2035' }}>
                    <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '30px', height: '30px', background: '#7C3AED', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
                            {profile?.role === 'owner' ? '👑' : '👤'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name || user?.email?.split('@')[0]}</div>
                            <div style={{ fontSize: '10px', color: '#6b7280' }}>{profile?.role}</div>
                        </div>
                        <button onClick={handleLogout} title="Sign out" style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '16px' }}>↩</button>
                    </div>
                </div>
            </div>

            {/* MAIN */}
            <div style={s.main}>
                {/* TOPBAR */}
                <div style={s.topbar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {mobile && (
                            <button onClick={() => setSidebarOpen(true)}
                                style={{ background: 'none', border: '1px solid #1a2035', borderRadius: '8px', color: '#9ca3af', cursor: 'pointer', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                                ☰
                            </button>
                        )}
                        <span style={{ fontSize: '15px' }}>{navItems.find(n => n.id === activeTab)?.icon}</span>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>{navItems.find(n => n.id === activeTab)?.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {!mobile && [
                            { label: lang === 'ar' ? 'وثائق' : 'Docs', value: documents.length, color: '#7C3AED' },
                            { label: lang === 'ar' ? 'قرارات' : 'Decisions', value: decisions.length, color: '#0891b2' },
                        ].map((stat, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '15px', fontWeight: '700', color: stat.color }}>{stat.value}</span>
                                <span style={{ fontSize: '11px', color: '#374151' }}>{stat.label}</span>
                            </div>
                        ))}

                        {/* BELL */}
                        <div style={{ position: 'relative' }} data-bell>
                            <button onClick={() => setShowAlertsDropdown(p => !p)}
                                style={{ background: alerts.length > 0 ? '#1a0505' : 'none', border: `1px solid ${alerts.length > 0 ? '#450a0a' : '#1a2035'}`, borderRadius: '8px', color: alerts.length > 0 ? '#f87171' : '#6b7280', cursor: 'pointer', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', position: 'relative' }}>
                                🔔
                                {alerts.length > 0 && (
                                    <span style={{ position: 'absolute', top: '-7px', right: '-7px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', minWidth: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0D1117', padding: '0 3px' }}>
                                        {alerts.length > 9 ? '9+' : alerts.length}
                                    </span>
                                )}
                            </button>
                            {showAlertsDropdown && (
                                <div style={{ position: 'absolute', top: '44px', right: '0', width: mobile ? '280px' : '320px', background: '#0D1117', border: '1px solid #1a2035', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 1000, overflow: 'hidden' }}>
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a2035', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600' }}>🔔 {lang === 'ar' ? 'التنبيهات' : 'Alerts'} {alerts.length > 0 && <span style={{ color: '#ef4444' }}>({alerts.length})</span>}</span>
                                        <button onClick={() => { setActiveTab('alerts'); setShowAlertsDropdown(false) }} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: '11px', cursor: 'pointer' }}>
                                            {lang === 'ar' ? 'عرض الكل ←' : 'View all →'}
                                        </button>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {alerts.length === 0 ? (
                                            <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                                                <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                                                {lang === 'ar' ? 'لا توجد تنبيهات' : 'No active alerts'}
                                            </div>
                                        ) : alerts.map((a: any) => (
                                            <div key={a.id} style={{ padding: '12px 16px', borderBottom: '1px solid #1a2035', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                <div style={{ width: '8px', height: '8px', background: a.severity === 'high' ? '#ef4444' : '#fbbf24', borderRadius: '50%', marginTop: '5px', flexShrink: 0 }}></div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{a.type} · {a.severity}</div>
                                                </div>
                                                {profile?.role === 'owner' && (
                                                    <button onClick={() => handleResolveAlert(a.id)} style={{ background: 'none', border: '1px solid #166534', color: '#4ade80', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                        {lang === 'ar' ? 'حل' : 'Resolve'}
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

                {/* CONTENT */}
                <div style={s.content}>

                    {/* OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div>
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: mobile ? '18px' : '22px', fontWeight: '700', marginBottom: '4px' }}>
                                    {lang === 'ar' ? `مرحباً، ${profile?.full_name?.split(' ')[0] || 'يا مدير'} 👋` : `Welcome back, ${profile?.full_name?.split(' ')[0] || 'there'} 👋`}
                                </h2>
                                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                                    {company?.name} · {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                                {[
                                    { icon: '📄', label: lang === 'ar' ? 'الوثائق' : 'Docs', value: documents.length, color: '#7C3AED', tab: 'documents' },
                                    { icon: '⚖️', label: lang === 'ar' ? 'القرارات' : 'Decisions', value: decisions.length, color: '#0891b2', tab: 'decisions' },
                                    { icon: '📅', label: lang === 'ar' ? 'الأحداث' : 'Events', value: timeline.length, color: '#059669', tab: 'timeline' },
                                    { icon: '🚨', label: lang === 'ar' ? 'التنبيهات' : 'Alerts', value: alerts.length, color: alerts.length > 0 ? '#ef4444' : '#6b7280', tab: 'alerts' },
                                ].map((stat, i) => (
                                    <div key={i} onClick={() => setActiveTab(stat.tab)}
                                        style={{ background: '#0D1117', border: `1px solid ${i === 3 && alerts.length > 0 ? '#450a0a' : '#1a2035'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer' }}>
                                        <div style={{ fontSize: '20px', marginBottom: '8px' }}>{stat.icon}</div>
                                        <div style={{ fontSize: '28px', fontWeight: '800', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '12px', padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444' }}>🚨 {lang === 'ar' ? 'آخر التنبيهات' : 'Recent Alerts'}</span>
                                        <button onClick={() => setActiveTab('alerts')} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: '12px', cursor: 'pointer' }}>{lang === 'ar' ? 'عرض الكل ←' : 'View all →'}</button>
                                    </div>
                                    {alerts.length === 0 ? <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '13px' }}>✅ {lang === 'ar' ? 'لا توجد تنبيهات' : 'No alerts'}</div>
                                        : alerts.slice(0, 3).map((a: any) => (
                                            <div key={a.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                <div style={{ width: '8px', height: '8px', background: a.severity === 'high' ? '#ef4444' : '#fbbf24', borderRadius: '50%', marginTop: '5px', flexShrink: 0 }}></div>
                                                <div><div style={{ fontSize: '13px', fontWeight: '600' }}>{a.title}</div><div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{a.type}</div></div>
                                            </div>
                                        ))}
                                </div>
                                <div style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '12px', padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#0891b2' }}>⚖️ {lang === 'ar' ? 'آخر القرارات' : 'Recent Decisions'}</span>
                                        <button onClick={() => setActiveTab('decisions')} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: '12px', cursor: 'pointer' }}>{lang === 'ar' ? 'عرض الكل ←' : 'View all →'}</button>
                                    </div>
                                    {decisions.length === 0 ? <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '13px' }}>⚖️ {lang === 'ar' ? 'لا توجد قرارات' : 'No decisions'}</div>
                                        : decisions.slice(0, 3).map((d: any) => (
                                            <div key={d.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                <div style={{ width: '8px', height: '8px', background: '#0891b2', borderRadius: '50%', marginTop: '5px', flexShrink: 0 }}></div>
                                                <div><div style={{ fontSize: '13px', fontWeight: '600' }}>{d.title}</div><div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{new Date(d.created_at).toLocaleDateString()}</div></div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                            {intelligence ? (
                                <div style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '12px', padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#a78bfa' }}>🎯 {lang === 'ar' ? 'صحة الشركة' : 'Company Health'}</span>
                                        <button onClick={() => setActiveTab('intelligence')} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: '12px', cursor: 'pointer' }}>{lang === 'ar' ? 'تفاصيل ←' : 'Details →'}</button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                        {[
                                            { label: lang === 'ar' ? 'المعرفة' : 'Knowledge', value: intelligence.scores?.knowledge_score || 0, color: '#7C3AED' },
                                            { label: lang === 'ar' ? 'الفريق' : 'Team', value: intelligence.scores?.team_score || 0, color: '#0891b2' },
                                            { label: lang === 'ar' ? 'النشاط' : 'Activity', value: intelligence.scores?.activity_score || 0, color: '#059669' },
                                            { label: lang === 'ar' ? 'الكلي' : 'Overall', value: intelligence.scores?.overall_score || 0, color: '#d97706' },
                                        ].map((sc, i) => (
                                            <div key={i} style={{ textAlign: 'center' }}>
                                                <ScoreCircle value={sc.value} color={sc.color} size={mobile ? 56 : 64} />
                                                <div style={{ fontSize: '11px', color: '#6b7280' }}>{sc.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {intelligence.summary && <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1a2035', fontSize: '13px', color: '#9ca3af', lineHeight: '1.6' }}>{intelligence.summary.substring(0, 200)}...</div>}
                                </div>
                            ) : (
                                <div style={{ background: '#0D1117', border: '1px solid #1a2035', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>{lang === 'ar' ? 'لم يتم تحليل الشركة بعد' : 'Not analyzed yet'}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>{lang === 'ar' ? 'ارفع وثائق وشغّل التحليل' : 'Upload documents and run analysis'}</div>
                                    <button onClick={() => { setActiveTab('intelligence'); loadIntelligence() }} style={s.btn}>{lang === 'ar' ? 'تحليل الآن ←' : 'Analyze Now →'}</button>
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
                                    onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAsk() }}
                                    style={{ ...s.input, resize: 'none', minHeight: '100px', marginBottom: '12px' }} rows={4} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#374151' }}>Ctrl+Enter {lang === 'ar' ? 'للإرسال' : 'to send'}</span>
                                    <button onClick={handleAsk} disabled={asking || !question.trim()} style={s.btn}>{asking ? '...' : lang === 'ar' ? 'اسأل ←' : 'Ask →'}</button>
                                </div>
                            </div>
                            {answer && (
                                <div style={{ ...s.card, borderColor: '#4C1D95' }}>
                                    <div style={{ fontSize: '12px', color: '#a78bfa', marginBottom: '10px', fontWeight: '600' }}>🧠 {lang === 'ar' ? 'الإجابة' : 'Answer'}</div>
                                    <p style={{ fontSize: '14px', color: '#d1d5db', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{answer}</p>
                                    {sources.length > 0 && (
                                        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #1a2035' }}>
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>📎 {lang === 'ar' ? 'المصادر' : 'Sources'}</div>
                                            {sources.map((src: any, i: number) => (
                                                <div key={i} style={{ background: '#080C14', borderRadius: '6px', padding: '8px 12px', marginBottom: '6px', fontSize: '12px', color: '#9ca3af', borderLeft: '3px solid #7C3AED' }}>
                                                    <span style={{ color: '#7C3AED', fontWeight: '600' }}>{src.document_name}</span> — {src.content?.substring(0, 100)}...
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {conversations.length > 0 && (
                                <div style={s.card}>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px', fontWeight: '600' }}>🕒 {lang === 'ar' ? 'المحادثات السابقة' : 'Previous conversations'}</div>
                                    {conversations.slice(0, 5).map((c: any) => (
                                        <div key={c.id} style={{ borderBottom: '1px solid #1a2035', paddingBottom: '14px', marginBottom: '14px' }}>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '11px', background: '#1a0a2e', color: '#a78bfa', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>Q</span>
                                                <div style={{ fontSize: '13px', color: '#d1d5db' }}>{c.question}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <span style={{ fontSize: '11px', background: '#052e16', color: '#4ade80', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>A</span>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{c.answer?.substring(0, 150)}...</div>
                                            </div>
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
                                                    <ScoreCircle value={sc.value} color={sc.color} size={mobile ? 60 : 80} />
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
                                    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                        {intelligence.risks?.length > 0 && (
                                            <div style={s.card}>
                                                <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '12px', fontWeight: '600' }}>⚠️ {lang === 'ar' ? 'المخاطر' : 'Risks'} ({intelligence.risks.length})</div>
                                                {intelligence.risks.map((r: any, i: number) => (
                                                    <div key={i} style={{ background: '#1a0505', border: '1px solid #450a0a', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: '600' }}>{r.title}</span>
                                                            <span style={{ fontSize: '10px', color: r.severity === 'high' ? '#f87171' : '#fbbf24', fontWeight: '600' }}>{r.severity}</span>
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
                                            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
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
                                    {intelligence.insights?.length > 0 && (
                                        <div style={s.card}>
                                            <div style={{ fontSize: '12px', color: '#0891b2', marginBottom: '12px', fontWeight: '600' }}>🔍 {lang === 'ar' ? 'رؤى ذكية' : 'Smart Insights'}</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                                                {intelligence.insights.map((ins: any, i: number) => (
                                                    <div key={i} style={{ background: '#080C14', border: '1px solid #1a2035', borderRadius: '8px', padding: '12px' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#60a5fa', marginBottom: '4px' }}>{ins.title}</div>
                                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{ins.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <button onClick={() => loadIntelligence(true)} style={{ ...s.btnOutline, width: '100%', padding: '12px' }}>🔄 {lang === 'ar' ? 'تحديث التحليل' : 'Refresh'}</button>
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
                                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
                                    <div style={{ color: '#a78bfa' }}>{lang === 'ar' ? 'جاري الإنشاء...' : 'Generating...'}</div>
                                </div>
                            ) : briefing ? (
                                <>
                                    <div style={{ ...s.card, borderColor: '#4C1D95', background: '#0a0520' }}>
                                        <div style={{ fontSize: '12px', color: '#a78bfa', marginBottom: '8px', fontWeight: '600' }}>📊 {lang === 'ar' ? 'التقرير الأسبوعي' : 'Weekly Briefing'}</div>
                                        <p style={{ fontSize: '16px', fontWeight: '600' }}>{briefing.headline}</p>
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
                                    {briefing.next_week_focus?.length > 0 && (
                                        <div style={s.card}>
                                            <div style={{ fontSize: '12px', color: '#4ade80', marginBottom: '12px', fontWeight: '600' }}>🚀 {lang === 'ar' ? 'تركيز الأسبوع القادم' : 'Next Week Focus'}</div>
                                            {briefing.next_week_focus.map((f: string, i: number) => (
                                                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px', color: '#d1d5db' }}>
                                                    <span style={{ color: '#4ade80' }}>→</span><span>{f}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={loadBriefing} style={{ ...s.btnOutline, flex: 1, padding: '12px' }}>🔄 {lang === 'ar' ? 'تقرير جديد' : 'New'}</button>
                                        <button onClick={() => { const t = `${briefing.headline}\n\n${briefing.top_priorities?.map((p: any) => `• ${p.title}: ${p.action}`).join('\n')}`; navigator.clipboard.writeText(t); showToast(lang === 'ar' ? 'تم النسخ!' : 'Copied!') }} style={{ ...s.btnOutline, padding: '12px 20px' }}>📋</button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
                                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>{lang === 'ar' ? 'التقرير الأسبوعي' : 'Weekly Briefing'}</div>
                                    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>{lang === 'ar' ? 'تقرير ذكي يلخص أسبوع شركتك' : 'AI summary of your week'}</div>
                                    <button onClick={loadBriefing} style={s.btn}>{lang === 'ar' ? 'إنشاء التقرير' : 'Generate'}</button>
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
                                    <input type="text" placeholder={lang === 'ar' ? 'عنوان القرار...' : 'Decision title...'} value={newDecision.title} onChange={e => setNewDecision(p => ({ ...p, title: e.target.value }))} style={{ ...s.input, marginBottom: '10px' }} />
                                    <textarea placeholder={lang === 'ar' ? 'لماذا تم اتخاذ هذا القرار؟' : 'Why?'} value={newDecision.description} onChange={e => setNewDecision(p => ({ ...p, description: e.target.value }))} style={{ ...s.input, resize: 'none', marginBottom: '10px' }} rows={3} />
                                    <button onClick={handleAddDecision} disabled={addingDecision || !newDecision.title} style={s.btn}>{addingDecision ? '...' : lang === 'ar' ? 'تسجيل' : 'Record'}</button>
                                </div>
                            )}
                            <div style={s.card}>
                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#6b7280' }}>{lang === 'ar' ? `القرارات (${decisions.length})` : `Decisions (${decisions.length})`}</div>
                                {decisions.length === 0 ? <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>{lang === 'ar' ? 'لا توجد قرارات بعد' : 'No decisions yet'}</div>
                                    : decisions.map((d: any) => (
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
                            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '16px', color: '#ef4444' }}>🚨 {lang === 'ar' ? `التنبيهات (${alerts.length})` : `Alerts (${alerts.length})`}</div>
                            {alerts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                                    <div style={{ color: '#6b7280' }}>{lang === 'ar' ? 'لا توجد تنبيهات' : 'No active alerts'}</div>
                                </div>
                            ) : alerts.map((a: any) => (
                                <div key={a.id} style={{ background: '#1a0505', border: '1px solid #450a0a', borderRadius: '8px', padding: '14px', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                                        <div>
                                            <span style={{ fontSize: '10px', color: '#9ca3af', display: 'block', marginBottom: '2px' }}>{a.type}</span>
                                            <span style={{ fontSize: '14px', fontWeight: '600' }}>{a.title}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={s.badge(a.severity === 'high' ? 'red' : 'neutral')}>{a.severity}</span>
                                            {profile?.role === 'owner' && <button onClick={() => handleResolveAlert(a.id)} style={s.btnOutline}>{lang === 'ar' ? 'حل' : 'Resolve'}</button>}
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
                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>🔍 {lang === 'ar' ? 'تحليل الأسباب الجذرية' : 'Root Cause Analysis'}</div>
                                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>{lang === 'ar' ? 'اسأل: ليه حصلت كذا؟' : 'Ask why something happened'}</p>
                                <textarea value={rootCauseQuery} onChange={e => setRootCauseQuery(e.target.value)} placeholder={lang === 'ar' ? 'مثال: ليه نزلت المبيعات؟' : 'Example: Why did sales drop?'} style={{ ...s.input, resize: 'none', marginBottom: '10px' }} rows={3} />
                                <button onClick={handleRootCause} disabled={loadingRootCause || !rootCauseQuery.trim()} style={s.btn}>{loadingRootCause ? '...' : lang === 'ar' ? 'حلل' : 'Analyze'}</button>
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
                                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
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
                                            <div style={{ fontSize: '12px', color: '#4ade80', marginBottom: '12px', fontWeight: '600' }}>🛡️ {lang === 'ar' ? 'توصيات' : 'Prevention'}</div>
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
                                    <div style={{ color: '#a78bfa' }}>{lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}</div>
                                </div>
                            ) : whatChanged ? (
                                <>
                                    <div style={{ ...s.card, borderColor: '#4C1D95', background: '#0a0520' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                            <div style={{ fontSize: '12px', color: '#a78bfa', fontWeight: '600' }}>🔄 {lang === 'ar' ? 'ملخص' : 'Summary'}</div>
                                            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                                                <span style={{ color: '#6b7280' }}>{lang === 'ar' ? 'السرعة:' : 'Velocity:'} <span style={{ color: whatChanged.change_velocity === 'high' ? '#ef4444' : '#fbbf24', fontWeight: '600' }}>{whatChanged.change_velocity}</span></span>
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
                                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
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
                                    <button onClick={loadWhatChanged} style={{ ...s.btnOutline, width: '100%', padding: '12px' }}>🔄 {lang === 'ar' ? 'تحديث' : 'Refresh'}</button>
                                </>
                            ) : (
                                <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔄</div>
                                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>{lang === 'ar' ? 'محرك التغييرات' : 'What Changed'}</div>
                                    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>{lang === 'ar' ? 'يكتشف التغييرات تلقائياً' : 'Auto-detects meaningful changes'}</div>
                                    <button onClick={loadWhatChanged} style={s.btn}>{lang === 'ar' ? 'اكتشف' : 'Detect'}</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* KPIS */}
                    {activeTab === 'kpis' && (
                        <div>
                            <div style={s.card}>
                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>📈 {lang === 'ar' ? 'إضافة مؤشر' : 'Add KPI'}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                    <input placeholder={lang === 'ar' ? 'اسم المؤشر' : 'KPI name'} value={newKpi.name} onChange={e => setNewKpi(p => ({ ...p, name: e.target.value }))} style={{ ...s.input, gridColumn: mobile ? 'span 2' : 'auto' }} />
                                    <input type="number" placeholder={lang === 'ar' ? 'الحالية' : 'Current'} value={newKpi.value} onChange={e => setNewKpi(p => ({ ...p, value: e.target.value }))} style={s.input} />
                                    <input type="number" placeholder={lang === 'ar' ? 'السابقة' : 'Previous'} value={newKpi.previous_value} onChange={e => setNewKpi(p => ({ ...p, previous_value: e.target.value }))} style={s.input} />
                                    <input placeholder="%, $..." value={newKpi.unit} onChange={e => setNewKpi(p => ({ ...p, unit: e.target.value }))} style={s.input} />
                                </div>
                                <button onClick={handleAddKpi} disabled={addingKpi || !newKpi.name || !newKpi.value} style={s.btn}>{addingKpi ? '...' : lang === 'ar' ? 'إضافة' : 'Add KPI'}</button>
                            </div>
                            {kpis.length === 0 ? (
                                <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>📈</div>
                                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>{lang === 'ar' ? 'لا توجد مؤشرات' : 'No KPIs yet'}</div>
                                    <div style={{ color: '#6b7280', fontSize: '14px' }}>{lang === 'ar' ? 'أضف مؤشرات أداء شركتك' : 'Add your performance indicators'}</div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
                                    {kpis.map((kpi: any) => {
                                        const change = kpi.previous_value ? ((kpi.value - kpi.previous_value) / kpi.previous_value * 100) : null
                                        const isUp = change !== null && change >= 0
                                        return (
                                            <div key={kpi.id} style={{ ...s.stat, position: 'relative' }}>
                                                <button onClick={() => handleDeleteKpi(kpi.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{kpi.name}</div>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                                    <span style={{ fontSize: '28px', fontWeight: '800' }}>{kpi.value}</span>
                                                    {kpi.unit && <span style={{ fontSize: '14px', color: '#6b7280' }}>{kpi.unit}</span>}
                                                </div>
                                                {change !== null && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                                                        <span style={{ color: isUp ? '#4ade80' : '#f87171' }}>{isUp ? '↑' : '↓'}</span>
                                                        <span style={{ fontSize: '13px', fontWeight: '600', color: isUp ? '#4ade80' : '#f87171' }}>{Math.abs(change).toFixed(1)}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* DOCUMENTS */}
                    {activeTab === 'documents' && (
                        <div>
                            <div style={s.card}>
                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>📤 {lang === 'ar' ? 'رفع وثيقة' : 'Upload'}</div>
                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', border: '2px dashed #1a2035', borderRadius: '10px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#7C3AED')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a2035')}>
                                    {uploading ? <div style={{ color: '#a78bfa' }}>{lang === 'ar' ? 'جاري الرفع...' : 'Uploading...'}</div> : (
                                        <><div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div><div style={{ fontSize: '13px', color: '#6b7280' }}>{lang === 'ar' ? 'اضغط لرفع ملف' : 'Click to upload'}</div><div style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>PDF, DOCX, TXT, XLSX, CSV, Code</div></>
                                    )}
                                    <input type="file" style={{ display: 'none' }} accept=".pdf,.docx,.txt,.xlsx,.csv,.py,.js,.ts,.tsx,.jsx,.cpp,.java,.html,.css" onChange={handleUpload} />
                                </label>
                            </div>
                            <div style={s.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>{lang === 'ar' ? `الوثائق (${documents.length})` : `Documents (${documents.length})`}</div>
                                    <input placeholder={lang === 'ar' ? '🔍 بحث...' : '🔍 Search...'} value={docSearch} onChange={e => setDocSearch(e.target.value)} style={{ ...s.input, width: mobile ? '100%' : '180px', padding: '6px 12px', fontSize: '12px' }} />
                                </div>
                                {filteredDocs.length === 0 ? <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>{docSearch ? 'No results' : (lang === 'ar' ? 'لا توجد وثائق' : 'No documents yet')}</div>
                                    : filteredDocs.map((doc: any) => (
                                        <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1a2035' }}>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', minWidth: 0 }}>
                                                <span style={{ fontSize: '20px', flexShrink: 0 }}>📄</span>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{new Date(doc.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                                <span style={s.badge(doc.status === 'completed' ? 'green' : 'neutral')}>{doc.status}</span>
                                                <button onClick={() => handleDelete(doc.id)} style={{ ...s.btnOutline, color: '#ef4444', borderColor: '#450a0a', padding: '6px 10px' }}>✕</button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* TIMELINE */}
                    {activeTab === 'timeline' && (
                        <div style={s.card}>
                            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>📅 {lang === 'ar' ? 'تاريخ الشركة' : 'Timeline'}</div>
                            {timeline.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>{lang === 'ar' ? 'ارفع وثائق لاستخراج الأحداث' : 'Upload documents to auto-extract events'}</div>
                                : (
                                    <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #1a2035' }}>
                                        {timeline.map((event: any, i: number) => (
                                            <div key={event.id} style={{ position: 'relative', marginBottom: '24px' }}>
                                                <div style={{ position: 'absolute', left: '-33px', width: '18px', height: '18px', background: '#7C3AED', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' }}>{i + 1}</div>
                                                <div style={{ background: '#080C14', border: '1px solid #1a2035', borderRadius: '8px', padding: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
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
                                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>➕ {lang === 'ar' ? 'دعوة عضو' : 'Invite'}</div>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                        <select value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} style={{ ...s.input, width: 'auto', flex: 1 }}>
                                            <option value="employee">👤 {lang === 'ar' ? 'موظف' : 'Employee'}</option>
                                            <option value="dept_head">🏢 {lang === 'ar' ? 'مدير قسم' : 'Dept Head'}</option>
                                        </select>
                                        <button onClick={handleGenerateInvite} disabled={generatingCode} style={s.btn}>{generatingCode ? '...' : lang === 'ar' ? 'إنشاء كود' : 'Generate'}</button>
                                    </div>
                                    {inviteCodes.length > 0 && (
                                        <div>
                                            {inviteCodes.slice(0, 5).map((code: any) => (
                                                <div key={code.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080C14', border: '1px solid #1a2035', borderRadius: '8px', padding: '10px 14px', marginBottom: '6px' }}>
                                                    <div>
                                                        <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '700', color: '#a78bfa' }}>{code.code}</span>
                                                        <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '10px' }}>{code.role}</span>
                                                    </div>
                                                    <button onClick={() => { navigator.clipboard.writeText(code.code); showToast(lang === 'ar' ? 'تم النسخ!' : 'Copied!') }} style={s.btnOutline}>{lang === 'ar' ? 'نسخ' : 'Copy'}</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div style={s.card}>
                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '16px', color: '#6b7280' }}>{lang === 'ar' ? `الفريق (${members.length})` : `Team (${members.length})`}</div>
                                {members.map((m: any) => (
                                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a2035' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <div style={{ width: '32px', height: '32px', background: m.role === 'owner' ? '#7C3AED' : '#1a2035', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                                                {m.role === 'owner' ? '👑' : m.role === 'dept_head' ? '🏢' : '👤'}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: '600' }}>{m.full_name}</div>
                                                <div style={{ fontSize: '11px', color: '#6b7280' }}>{m.role}</div>
                                            </div>
                                        </div>
                                        {profile?.role === 'owner' && m.id !== user?.id && (
                                            <button onClick={async () => { if (!confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Remove?')) return; await fetch('/api/team', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: m.id }) }); setMembers(prev => prev.filter(x => x.id !== m.id)); showToast('Removed', 'info') }}
                                                style={{ ...s.btnOutline, color: '#ef4444', borderColor: '#450a0a' }}>{lang === 'ar' ? 'إزالة' : 'Remove'}</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SETTINGS */}
                    {activeTab === 'settings' && (
                        <div>
                            <div style={s.card}>
                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>🏢 {lang === 'ar' ? 'إعدادات الشركة' : 'Company Settings'}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{lang === 'ar' ? 'اسم الشركة' : 'Company Name'}</div>
                                        <input value={companyEdit.name} onChange={e => setCompanyEdit(p => ({ ...p, name: e.target.value }))} style={s.input} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{lang === 'ar' ? 'القطاع' : 'Industry'}</div>
                                        <input value={companyEdit.industry} onChange={e => setCompanyEdit(p => ({ ...p, industry: e.target.value }))} style={s.input} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{lang === 'ar' ? 'لغة التطبيق' : 'Language'}</div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {[{ key: 'en', flag: '🇬🇧', label: 'English' }, { key: 'ar', flag: '🇸🇦', label: 'العربية' }].map(l => (
                                            <button key={l.key} onClick={() => setCompanyEdit(p => ({ ...p, language: l.key }))}
                                                style={{ padding: '10px 20px', borderRadius: '8px', border: `2px solid ${companyEdit.language === l.key ? '#7C3AED' : '#1a2035'}`, background: companyEdit.language === l.key ? '#1a0a2e' : 'transparent', color: companyEdit.language === l.key ? '#a78bfa' : '#6b7280', cursor: 'pointer', fontSize: '14px' }}>
                                                {l.flag} {l.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleSaveCompany} disabled={savingCompany} style={s.btn}>{savingCompany ? '...' : lang === 'ar' ? 'حفظ' : 'Save'}</button>
                            </div>
                            <div style={s.card}>
                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>👤 {lang === 'ar' ? 'معلوماتك' : 'Profile'}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#080C14', borderRadius: '10px', border: '1px solid #1a2035' }}>
                                    <div style={{ width: '48px', height: '48px', background: '#7C3AED', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                                        {profile?.role === 'owner' ? '👑' : '👤'}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: '15px', fontWeight: '600' }}>{profile?.full_name}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                                        <div style={{ fontSize: '11px', color: '#7C3AED', marginTop: '2px' }}>{profile?.role} · {company?.name}</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ ...s.card, borderColor: '#450a0a' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#ef4444' }}>⚠️ {lang === 'ar' ? 'منطقة الخطر' : 'Danger Zone'}</div>
                                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>{lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}</p>
                                <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #450a0a', color: '#ef4444', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                    ↩ {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* TOAST */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: toast.type === 'success' ? '#052e16' : toast.type === 'error' ? '#450a0a' : '#0a1628', border: `1px solid ${toast.type === 'success' ? '#166534' : toast.type === 'error' ? '#991b1b' : '#1e3a5f'}`, color: toast.type === 'success' ? '#4ade80' : toast.type === 'error' ? '#f87171' : '#60a5fa', padding: '12px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                    {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'} {toast.message}
                </div>
            )}
        </div>
    )
}