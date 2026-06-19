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

    const tx = t[lang]
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

    async function loadDocuments(companyId: string) {
        const res = await fetch(`/api/documents?company_id=${companyId}`)
        const data = await res.json()
        if (data.documents) setDocuments(data.documents)
    }

    async function loadConversations(companyId: string) {
        const res = await fetch(`/api/chat?company_id=${companyId}`)
        const data = await res.json()
        if (data.conversations) setConversations(data.conversations)
    }

    async function loadTimeline(companyId: string) {
        const res = await fetch(`/api/timeline?company_id=${companyId}`)
        const data = await res.json()
        if (data.events) setTimeline(data.events)
    }

    async function loadTeam(companyId: string) {
        const [membersRes, codesRes] = await Promise.all([
            fetch(`/api/team?company_id=${companyId}`),
            fetch(`/api/invite?company_id=${companyId}`)
        ])
        const membersData = await membersRes.json()
        const codesData = await codesRes.json()
        if (membersData.members) setMembers(membersData.members)
        if (codesData.codes) setInviteCodes(codesData.codes)
    }

    async function loadDecisions(companyId: string) {
        const res = await fetch(`/api/decisions?company_id=${companyId}`)
        const data = await res.json()
        if (data.decisions) setDecisions(data.decisions)
    }

    async function loadAlerts(companyId: string) {
        const res = await fetch(`/api/alerts?company_id=${companyId}`)
        const data = await res.json()
        if (data.alerts) setAlerts(data.alerts)
    }

    async function loadIntelligence(forceRefresh = false) {
        if (!profile) return
        setLoadingIntelligence(true)
        const res = await fetch('/api/intelligence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: profile.company_id, force_refresh: forceRefresh })
        })
        const data = await res.json()
        if (data.intelligence) setIntelligence(data.intelligence)
        setLoadingIntelligence(false)
    }

    async function loadBriefing() {
        if (!profile) return
        setLoadingBriefing(true)
        const res = await fetch('/api/briefing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: profile.company_id })
        })
        const data = await res.json()
        if (data.briefing) setBriefing(data.briefing)
        setLoadingBriefing(false)
    }

    async function handleAddDecision() {
        if (!newDecision.title.trim() || !profile) return
        setAddingDecision(true)
        const res = await fetch('/api/decisions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: profile.company_id, title: newDecision.title, description: newDecision.description, made_by: user.id })
        })
        const data = await res.json()
        if (data.success) {
            await loadDecisions(profile.company_id)
            await loadAlerts(profile.company_id)
            setNewDecision({ title: '', description: '' })
        }
        setAddingDecision(false)
    }

    async function handleResolveAlert(alertId: string) {
        await fetch('/api/alerts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: alertId }) })
        setAlerts(prev => prev.filter(a => a.id !== alertId))
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file || !profile) return
        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('company_id', profile.company_id)
        formData.append('user_id', user.id)
        const res = await fetch('/api/documents', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.success) {
            await loadDocuments(profile.company_id)
            await loadTimeline(profile.company_id)
        }
        setUploading(false)
    }

    async function handleAsk() {
        if (!question.trim() || !profile) return
        setAsking(true)
        setAnswer('')
        setSources([])
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, company_id: profile.company_id, user_id: user.id }),
        })
        const data = await res.json()
        if (data.answer) {
            setAnswer(data.answer)
            setSources(data.sources || [])
            loadConversations(profile.company_id)
        }
        setAsking(false)
    }

    async function handleDelete(docId: string) {
        if (!confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return
        const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) setDocuments(prev => prev.filter(d => d.id !== docId))
    }

    async function handleGenerateInvite() {
        if (!profile) return
        setGeneratingCode(true)
        const res = await fetch('/api/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: profile.company_id, role: newMemberRole, created_by: user.id })
        })
        const data = await res.json()
        if (data.code) await loadTeam(profile.company_id)
        setGeneratingCode(false)
    }

    async function handleRemoveMember(userId: string) {
        if (!confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return
        await fetch('/api/team', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }) })
        setMembers(prev => prev.filter(m => m.id !== userId))
    }

    async function handleRootCause() {
        if (!rootCauseQuery.trim() || !profile) return
        setLoadingRootCause(true)
        setRootCause(null)
        const res = await fetch('/api/rootcause', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

    const roleLabel = (role: string) => {
        if (role === 'owner') return `👑 ${tx.owner}`
        if (role === 'dept_head') return `🏢 ${tx.deptHead}`
        return `👤 ${tx.employee}`
    }

    const canDelete = (doc: any) =>
        profile?.role === 'owner' || profile?.role === 'dept_head' || doc.uploaded_by === user?.id

    const severityColor = (severity: string) => {
        if (severity === 'high') return 'text-red-400 bg-red-900/30 border-red-800'
        if (severity === 'medium') return 'text-yellow-400 bg-yellow-900/30 border-yellow-800'
        return 'text-green-400 bg-green-900/30 border-green-800'
    }

    const severityLabel = (severity: string) => {
        if (lang === 'ar') return severity === 'high' ? 'عالي' : severity === 'medium' ? 'متوسط' : 'منخفض'
        return severity === 'high' ? 'High' : severity === 'medium' ? 'Medium' : 'Low'
    }

    const tabs = ['chat', 'intelligence', 'briefing', 'decisions', 'alerts', 'rootcause', 'whatchanged', 'documents', 'timeline', 'team']

    const tabLabel = (tab: string) => {
        const labels: any = {
            chat: `💬 ${tx.askMemory}`,
            intelligence: `🎯 ${tx.intelligence}`,
            briefing: `📊 ${lang === 'ar' ? 'التقرير الأسبوعي' : 'Weekly Briefing'}`,
            decisions: `⚖️ ${lang === 'ar' ? 'القرارات' : 'Decisions'}`,
            alerts: `🚨 ${lang === 'ar' ? 'التنبيهات' : 'Alerts'} ${alerts.length > 0 ? `(${alerts.length})` : ''}`,
            rootcause: `🔍 ${lang === 'ar' ? 'تحليل الأسباب' : 'Root Cause'}`,
            whatchanged: `🔄 ${lang === 'ar' ? 'ما الذي تغير' : 'What Changed'}`,
            documents: `📄 ${tx.documents}`,
            timeline: `📅 ${lang === 'ar' ? 'التايم لاين' : 'Timeline'}`,
            team: `👥 ${tx.team}`,
        }
        return labels[tab]
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white" dir={isRTL ? 'rtl' : 'ltr'}>
            <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🧠</span>
                    <div>
                        <h1 className="font-bold text-lg">MemoryOS</h1>
                        <p className="text-xs text-gray-400">{company?.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {alerts.length > 0 && (
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                            {alerts.length} {lang === 'ar' ? 'تنبيه' : 'alerts'}
                        </span>
                    )}
                    <span className="text-xs text-purple-400">{roleLabel(profile?.role)}</span>
                    <span className="text-sm text-gray-400">{user?.email}</span>
                    <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors">{tx.logout}</button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto p-6">
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: tx.documents, value: documents.length },
                        { label: lang === 'ar' ? 'القرارات' : 'Decisions', value: decisions.length },
                        { label: lang === 'ar' ? 'الأحداث' : 'Events', value: timeline.length },
                        { label: lang === 'ar' ? 'التنبيهات' : 'Alerts', value: alerts.length, alert: alerts.length > 0 },
                    ].map((stat, i) => (
                        <div key={i} className={`bg-gray-900 rounded-xl p-4 border ${stat.alert ? 'border-red-800' : 'border-gray-800'}`}>
                            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                            <p className={`text-3xl font-bold ${stat.alert ? 'text-red-400' : 'text-purple-400'}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 mb-6 flex-wrap">
                    {tabs.map((tab) => (
                        <button key={tab} onClick={() => {
                            setActiveTab(tab)
                            if (tab === 'intelligence' && !intelligence) loadIntelligence()
                        }}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                            {tabLabel(tab)}
                        </button>
                    ))}
                </div>

                {activeTab === 'chat' && (
                    <div className="space-y-4">
                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
                                placeholder={tx.askQuestion}
                                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-3 border border-gray-700 focus:outline-none focus:border-purple-500 resize-none"
                                rows={3} />
                            <button onClick={handleAsk} disabled={asking}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-all disabled:opacity-50">
                                {asking ? tx.searching : tx.ask}
                            </button>
                        </div>
                        {answer && (
                            <div className="bg-gray-900 rounded-xl p-6 border border-purple-800">
                                <h3 className="text-purple-400 font-medium mb-3">{tx.answer}:</h3>
                                <p className="text-gray-200 leading-relaxed">{answer}</p>
                                {sources.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-800">
                                        <p className="text-gray-400 text-sm mb-2">{tx.sources}:</p>
                                        {sources.map((s, i) => (
                                            <div key={i} className="text-xs text-gray-500 bg-gray-800 rounded p-2 mb-1">
                                                <span className="text-purple-400">{s.document_name}</span> — {s.content}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {conversations.length > 0 && (
                            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                <h3 className="text-gray-400 font-medium mb-3">{lang === 'ar' ? 'المحادثات السابقة' : 'Previous Conversations'}:</h3>
                                {conversations.slice(0, 5).map((c) => (
                                    <div key={c.id} className="border-b border-gray-800 pb-3 mb-3 last:border-0">
                                        <p className="text-sm text-purple-400 mb-1">{lang === 'ar' ? 'س' : 'Q'}: {c.question}</p>
                                        <p className="text-sm text-gray-400">{lang === 'ar' ? 'ج' : 'A'}: {c.answer.substring(0, 150)}...</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'intelligence' && (
                    <div className="space-y-4">
                        {loadingIntelligence ? (
                            <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
                                <div className="text-4xl mb-4 animate-pulse">🧠</div>
                                <p className="text-purple-400 font-medium">{tx.analyzing}</p>
                            </div>
                        ) : intelligence ? (
                            <>
                                {intelligence.scores && (
                                    <div className="grid grid-cols-4 gap-4">
                                        {[
                                            { label: lang === 'ar' ? 'المعرفة' : 'Knowledge', value: intelligence.scores.knowledge_score, color: '#9333ea' },
                                            { label: lang === 'ar' ? 'الفريق' : 'Team', value: intelligence.scores.team_score, color: '#3b82f6' },
                                            { label: lang === 'ar' ? 'النشاط' : 'Activity', value: intelligence.scores.activity_score, color: '#22c55e' },
                                            { label: lang === 'ar' ? 'الكلي' : 'Overall', value: intelligence.scores.overall_score, color: '#eab308' },
                                        ].map((score, i) => (
                                            <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
                                                <div className="relative w-16 h-16 mx-auto mb-3">
                                                    <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#374151" strokeWidth="3" />
                                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={score.color} strokeWidth="3" strokeDasharray={`${score.value} 100`} strokeLinecap="round" />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-white font-bold text-sm">{score.value}%</span>
                                                    </div>
                                                </div>
                                                <p className="text-gray-400 text-xs">{score.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {intelligence.summary && (
                                    <div className="bg-purple-900/20 rounded-xl p-6 border border-purple-800">
                                        <h3 className="text-purple-400 font-medium mb-2">📋 {tx.summary}</h3>
                                        <p className="text-gray-200 leading-relaxed">{intelligence.summary}</p>
                                        {intelligence.from_cache && (
                                            <p className="text-gray-500 text-xs mt-2">
                                                {lang === 'ar' ? '⚡ من الذاكرة المؤقتة' : '⚡ From cache'}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {intelligence.risks?.length > 0 && (
                                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                            <h3 className="font-medium mb-4 text-red-400">⚠️ {tx.risks} ({intelligence.risks.length})</h3>
                                            {intelligence.risks.map((risk: any, i: number) => (
                                                <div key={i} className={`rounded-lg p-3 mb-3 border ${severityColor(risk.severity)}`}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-medium text-sm">{risk.title}</p>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColor(risk.severity)}`}>{severityLabel(risk.severity)}</span>
                                                    </div>
                                                    <p className="text-xs mt-1 opacity-80">{risk.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {intelligence.opportunities?.length > 0 && (
                                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                            <h3 className="font-medium mb-4 text-green-400">🚀 {tx.opportunities} ({intelligence.opportunities.length})</h3>
                                            {intelligence.opportunities.map((opp: any, i: number) => (
                                                <div key={i} className="bg-green-900/20 rounded-lg p-3 mb-3 border border-green-800">
                                                    <p className="font-medium text-sm text-green-400">{opp.title}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{opp.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {intelligence.recommendations?.length > 0 && (
                                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                        <h3 className="font-medium mb-4 text-yellow-400">💡 {tx.recommendations}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {intelligence.recommendations.map((rec: any, i: number) => (
                                                <div key={i} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span>{rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'}</span>
                                                        <p className="font-medium text-sm">{rec.title}</p>
                                                    </div>
                                                    <p className="text-xs text-gray-400">{rec.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {intelligence.insights?.length > 0 && (
                                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                        <h3 className="font-medium mb-4 text-blue-400">🔍 {tx.insights}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {intelligence.insights.map((insight: any, i: number) => (
                                                <div key={i} className="bg-blue-900/20 rounded-lg p-4 border border-blue-800">
                                                    <p className="font-medium text-sm text-blue-400 mb-1">{insight.title}</p>
                                                    <p className="text-xs text-gray-400">{insight.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <button onClick={() => loadIntelligence(true)}
                                    className="w-full py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-purple-500 transition-all text-sm">
                                    🔄 {tx.refresh}
                                </button>
                            </>
                        ) : (
                            <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
                                <div className="text-4xl mb-4">🎯</div>
                                <h3 className="font-medium mb-2">{tx.intelligence}</h3>
                                <p className="text-gray-500 text-sm mb-6">{tx.uploadFirst}</p>
                                <button onClick={() => loadIntelligence(false)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all">
                                    {tx.analyze}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'briefing' && (
                    <div className="space-y-4">
                        {loadingBriefing ? (
                            <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
                                <div className="text-4xl mb-4 animate-pulse">📊</div>
                                <p className="text-purple-400">{lang === 'ar' ? 'جاري إنشاء التقرير...' : 'Generating briefing...'}</p>
                            </div>
                        ) : briefing ? (
                            <>
                                <div className="bg-purple-900/20 rounded-xl p-6 border border-purple-800">
                                    <h3 className="text-purple-400 font-medium mb-2">📊 {lang === 'ar' ? 'التقرير الأسبوعي' : 'Weekly Briefing'}</h3>
                                    <p className="text-white text-lg font-medium">{briefing.headline}</p>
                                </div>
                                {briefing.top_priorities?.length > 0 && (
                                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                        <h3 className="font-medium mb-4 text-yellow-400">🎯 {lang === 'ar' ? 'أولويات الأسبوع' : 'Top Priorities'}</h3>
                                        {briefing.top_priorities.map((p: any, i: number) => (
                                            <div key={i} className="bg-gray-800 rounded-lg p-4 mb-3 border border-gray-700">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span>{p.urgency === 'high' ? '🔴' : p.urgency === 'medium' ? '🟡' : '🟢'}</span>
                                                    <p className="font-medium text-sm">{p.title}</p>
                                                </div>
                                                <p className="text-xs text-gray-400">{p.action}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {briefing.what_changed?.length > 0 && (
                                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                        <h3 className="font-medium mb-4 text-blue-400">🔄 {lang === 'ar' ? 'ما الذي تغير؟' : 'What Changed?'}</h3>
                                        {briefing.what_changed.map((c: string, i: number) => (
                                            <div key={i} className="flex items-start gap-2 mb-2">
                                                <span className="text-blue-400 mt-1">•</span>
                                                <p className="text-sm text-gray-300">{c}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {briefing.next_week_focus?.length > 0 && (
                                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                        <h3 className="font-medium mb-4 text-green-400">🚀 {lang === 'ar' ? 'تركيز الأسبوع القادم' : 'Next Week Focus'}</h3>
                                        {briefing.next_week_focus.map((f: string, i: number) => (
                                            <div key={i} className="flex items-start gap-2 mb-2">
                                                <span className="text-green-400 mt-1">→</span>
                                                <p className="text-sm text-gray-300">{f}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button onClick={loadBriefing} className="w-full py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-purple-500 transition-all text-sm">
                                    🔄 {lang === 'ar' ? 'إنشاء تقرير جديد' : 'Generate New Briefing'}
                                </button>
                            </>
                        ) : (
                            <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
                                <div className="text-4xl mb-4">📊</div>
                                <h3 className="font-medium mb-2">{lang === 'ar' ? 'التقرير الأسبوعي' : 'Weekly Briefing'}</h3>
                                <p className="text-gray-500 text-sm mb-6">{lang === 'ar' ? 'تقرير ذكي يلخص أسبوع شركتك' : 'AI-powered summary of your company week'}</p>
                                <button onClick={loadBriefing} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all">
                                    {lang === 'ar' ? 'إنشاء التقرير' : 'Generate Briefing'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'decisions' && (
                    <div className="space-y-4">
                        {(profile?.role === 'owner' || profile?.role === 'dept_head') && (
                            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                <h3 className="font-medium mb-4">⚖️ {lang === 'ar' ? 'تسجيل قرار جديد' : 'Record New Decision'}</h3>
                                <input type="text" placeholder={lang === 'ar' ? 'عنوان القرار...' : 'Decision title...'} value={newDecision.title}
                                    onChange={e => setNewDecision(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-3 border border-gray-700 focus:outline-none focus:border-purple-500" />
                                <textarea placeholder={lang === 'ar' ? 'لماذا تم اتخاذ هذا القرار؟' : 'Why was this decision made?'} value={newDecision.description}
                                    onChange={e => setNewDecision(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-3 border border-gray-700 focus:outline-none focus:border-purple-500 resize-none" rows={3} />
                                <button onClick={handleAddDecision} disabled={addingDecision || !newDecision.title}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all disabled:opacity-50">
                                    {addingDecision ? '...' : lang === 'ar' ? 'تسجيل القرار' : 'Record Decision'}
                                </button>
                            </div>
                        )}
                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <h3 className="font-medium mb-4">{lang === 'ar' ? `القرارات (${decisions.length})` : `Decisions (${decisions.length})`}</h3>
                            {decisions.length === 0 ? (
                                <p className="text-gray-500 text-sm">{lang === 'ar' ? 'لا توجد قرارات مسجلة بعد' : 'No decisions recorded yet'}</p>
                            ) : decisions.map((decision) => (
                                <div key={decision.id} className="bg-gray-800 rounded-xl p-4 mb-3 border border-gray-700">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-medium text-white">{decision.title}</h4>
                                        <span className={`text-xs px-2 py-1 rounded-full ${decision.status === 'active' ? 'bg-green-900 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                            {decision.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'مكتمل' : 'Completed')}
                                        </span>
                                    </div>
                                    {decision.description && <p className="text-gray-400 text-sm mb-2">{decision.description}</p>}
                                    <p className="text-xs text-gray-500">{new Date(decision.created_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="space-y-4">
                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <h3 className="font-medium mb-4 text-red-400">🚨 {lang === 'ar' ? `التنبيهات النشطة (${alerts.length})` : `Active Alerts (${alerts.length})`}</h3>
                            {alerts.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-3">✅</div>
                                    <p className="text-gray-500 text-sm">{lang === 'ar' ? 'لا توجد تنبيهات نشطة' : 'No active alerts'}</p>
                                </div>
                            ) : alerts.map((alert) => (
                                <div key={alert.id} className={`rounded-xl p-4 mb-3 border ${severityColor(alert.severity)}`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <span className="text-xs opacity-70 mb-1 block">{alert.type}</span>
                                            <h4 className="font-medium text-sm">{alert.title}</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColor(alert.severity)}`}>{severityLabel(alert.severity)}</span>
                                            {profile?.role === 'owner' && (
                                                <button onClick={() => handleResolveAlert(alert.id)} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-gray-700">
                                                    {lang === 'ar' ? 'حل' : 'Resolve'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {alert.description && <p className="text-xs opacity-80">{alert.description}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'rootcause' && (
                    <div className="space-y-4">
                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <h3 className="font-medium mb-4">🔍 {lang === 'ar' ? 'محرك تحليل الأسباب الجذرية' : 'Root Cause Analysis Engine'}</h3>
                            <textarea value={rootCauseQuery} onChange={e => setRootCauseQuery(e.target.value)}
                                placeholder={lang === 'ar' ? 'مثال: ليه نزلت المبيعات الشهر ده؟' : 'Example: Why did sales drop this month?'}
                                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-3 border border-gray-700 focus:outline-none focus:border-purple-500 resize-none" rows={3} />
                            <button onClick={handleRootCause} disabled={loadingRootCause || !rootCauseQuery.trim()}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all disabled:opacity-50">
                                {loadingRootCause ? (lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...') : (lang === 'ar' ? 'حلل الأسباب' : 'Analyze')}
                            </button>
                        </div>
                        {rootCause && (
                            <>
                                <div className="bg-red-900/20 rounded-xl p-6 border border-red-800">
                                    <h3 className="text-red-400 font-medium mb-2">⚡ {lang === 'ar' ? 'السبب المباشر' : 'Immediate Cause'}</h3>
                                    <p className="text-gray-200">{rootCause.immediate_cause}</p>
                                </div>
                                {rootCause.root_causes?.length > 0 && (
                                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                        <h3 className="font-medium mb-4 text-orange-400">🌳 {lang === 'ar' ? 'الأسباب الجذرية' : 'Root Causes'}</h3>
                                        {rootCause.root_causes.map((rc: any, i: number) => (
                                            <div key={i} className="bg-gray-800 rounded-lg p-4 mb-3 border border-gray-700">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${rc.depth === 'systemic' ? 'bg-red-900 text-red-400' : rc.depth === 'deep' ? 'bg-orange-900 text-orange-400' : 'bg-yellow-900 text-yellow-400'}`}>{rc.depth}</span>
                                                    <p className="font-medium text-sm">{rc.cause}</p>
                                                </div>
                                                <p className="text-xs text-gray-400">{rc.evidence}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {rootCause.chain_of_events?.length > 0 && (
                                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                        <h3 className="font-medium mb-4 text-blue-400">🔗 {lang === 'ar' ? 'سلسلة الأحداث' : 'Chain of Events'}</h3>
                                        {rootCause.chain_of_events.map((step: string, i: number) => (
                                            <div key={i} className="flex items-start gap-3 mb-3">
                                                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                                                <p className="text-sm text-gray-300 mt-0.5">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {rootCause.prevention_recommendations?.length > 0 && (
                                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                        <h3 className="font-medium mb-4 text-green-400">🛡️ {lang === 'ar' ? 'توصيات للوقاية' : 'Prevention Recommendations'}</h3>
                                        {rootCause.prevention_recommendations.map((rec: string, i: number) => (
                                            <div key={i} className="flex items-start gap-2 mb-2">
                                                <span className="text-green-400 mt-1">✓</span>
                                                <p className="text-sm text-gray-300">{rec}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'whatchanged' && (
                    <div className="space-y-4">
                        {loadingWhatChanged ? (
                            <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
                                <div className="text-4xl mb-4 animate-pulse">🔄</div>
                                <p className="text-purple-400">{lang === 'ar' ? 'جاري تحليل التغييرات...' : 'Analyzing changes...'}</p>
                            </div>
                        ) : whatChanged ? (
                            <>
                                <div className="bg-purple-900/20 rounded-xl p-6 border border-purple-800">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-purple-400 font-medium">🔄 {lang === 'ar' ? 'ملخص التغييرات' : 'Changes Summary'}</h3>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-400">{lang === 'ar' ? 'سرعة التغيير:' : 'Velocity:'} <span className={`font-medium ${whatChanged.change_velocity === 'high' ? 'text-red-400' : whatChanged.change_velocity === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>{whatChanged.change_velocity}</span></span>
                                            <span className="text-xs text-gray-400">{lang === 'ar' ? 'الاستقرار:' : 'Stability:'} <span className="font-medium text-purple-400">{whatChanged.stability_score}%</span></span>
                                        </div>
                                    </div>
                                    <p className="text-gray-200">{whatChanged.summary}</p>
                                </div>
                                {whatChanged.significant_changes?.length > 0 && (
                                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                        <h3 className="font-medium mb-4 text-blue-400">📌 {lang === 'ar' ? 'التغييرات المهمة' : 'Significant Changes'}</h3>
                                        {whatChanged.significant_changes.map((change: any, i: number) => (
                                            <div key={i} className="bg-gray-800 rounded-lg p-4 mb-3 border border-gray-700">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span>{change.impact === 'positive' ? '✅' : change.impact === 'negative' ? '❌' : '➡️'}</span>
                                                    <p className="font-medium text-sm">{change.title}</p>
                                                    <span className="text-xs text-gray-500 ml-auto">{change.area}</span>
                                                </div>
                                                <p className="text-xs text-gray-400">{change.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {whatChanged.trends?.length > 0 && (
                                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                        <h3 className="font-medium mb-4 text-green-400">📈 {lang === 'ar' ? 'الاتجاهات' : 'Trends'}</h3>
                                        {whatChanged.trends.map((trend: any, i: number) => (
                                            <div key={i} className="bg-gray-800 rounded-lg p-4 mb-3 border border-gray-700">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span>{trend.direction === 'improving' ? '📈' : trend.direction === 'declining' ? '📉' : '➡️'}</span>
                                                    <p className="font-medium text-sm">{trend.trend}</p>
                                                </div>
                                                <p className="text-xs text-gray-400">{trend.evidence}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {whatChanged.anomalies?.length > 0 && (
                                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                        <h3 className="font-medium mb-4 text-red-400">⚠️ {lang === 'ar' ? 'أنماط غير عادية' : 'Anomalies'}</h3>
                                        {whatChanged.anomalies.map((anomaly: any, i: number) => (
                                            <div key={i} className="bg-red-900/20 rounded-lg p-4 mb-3 border border-red-800">
                                                <p className="font-medium text-sm text-red-400 mb-1">{anomaly.anomaly}</p>
                                                <p className="text-xs text-gray-400 mb-2">{anomaly.explanation}</p>
                                                <p className="text-xs text-yellow-400">→ {anomaly.action_needed}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button onClick={loadWhatChanged} className="w-full py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-purple-500 transition-all text-sm">
                                    🔄 {lang === 'ar' ? 'تحديث التحليل' : 'Refresh Analysis'}
                                </button>
                            </>
                        ) : (
                            <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
                                <div className="text-4xl mb-4">🔄</div>
                                <h3 className="font-medium mb-2">{lang === 'ar' ? 'محرك التغييرات' : 'What Changed Engine'}</h3>
                                <p className="text-gray-500 text-sm mb-6">{lang === 'ar' ? 'يكتشف التغييرات المهمة تلقائياً' : 'Automatically detects meaningful changes'}</p>
                                <button onClick={loadWhatChanged} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all">
                                    {lang === 'ar' ? 'اكتشف التغييرات' : 'Detect Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-4">
                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <h3 className="font-medium mb-4">{tx.uploadDoc}</h3>
                            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-purple-500 transition-colors">
                                <div className="text-center">
                                    {uploading ? <p className="text-purple-400">{tx.processing}</p> : (
                                        <><p className="text-gray-400 mb-1">{lang === 'ar' ? 'اضغط لرفع ملف' : 'Click to upload'}</p><p className="text-gray-600 text-sm">PDF, DOCX, TXT, XLSX, CSV, Code</p></>
                                    )}
                                </div>
                                <input type="file" className="hidden" accept=".pdf,.docx,.txt,.xlsx,.xls,.csv,.py,.js,.ts,.tsx,.jsx,.cpp,.java,.html,.css" onChange={handleUpload} />
                            </label>
                        </div>
                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <h3 className="font-medium mb-4">{tx.documents} ({documents.length})</h3>
                            {documents.length === 0 ? <p className="text-gray-500 text-sm">{tx.noDocuments}</p> : documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                                    <div>
                                        <p className="font-medium text-sm">{doc.name}</p>
                                        <p className="text-xs text-gray-500">{new Date(doc.created_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${doc.status === 'completed' ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>
                                            {doc.status === 'completed' ? tx.completed : tx.processing}
                                        </span>
                                        {canDelete(doc) && (
                                            <button onClick={() => handleDelete(doc.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-800">{tx.delete}</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <div className="space-y-4">
                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <h3 className="font-medium mb-6">📅 {lang === 'ar' ? 'تاريخ الشركة' : 'Company Timeline'}</h3>
                            {timeline.length === 0 ? <p className="text-gray-500 text-sm">{tx.uploadFirst}</p> : (
                                <div className="relative">
                                    <div className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-0 bottom-0 w-0.5 bg-purple-800`} />
                                    {timeline.map((event, i) => (
                                        <div key={event.id} className={`flex gap-6 mb-6 relative ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold shrink-0 z-10">{i + 1}</div>
                                            <div className="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-medium text-white text-sm">{event.title}</h4>
                                                    <span className="text-xs text-purple-400 shrink-0 mx-2">{new Date(event.event_date).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}</span>
                                                </div>
                                                <p className="text-gray-400 text-sm">{event.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="space-y-4">
                        {profile?.role === 'owner' && (
                            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                                <h3 className="font-medium mb-4">{tx.invite}</h3>
                                <div className="flex gap-3">
                                    <select value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-purple-500">
                                        <option value="employee">👤 {tx.employee}</option>
                                        <option value="dept_head">🏢 {tx.deptHead}</option>
                                    </select>
                                    <button onClick={handleGenerateInvite} disabled={generatingCode} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all disabled:opacity-50">
                                        {generatingCode ? '...' : lang === 'ar' ? 'إنشاء كود' : 'Generate Code'}
                                    </button>
                                </div>
                                {inviteCodes.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-gray-400 text-sm mb-3">{lang === 'ar' ? 'أكواد الدعوة:' : 'Invite Codes:'}</p>
                                        {inviteCodes.slice(0, 5).map(code => (
                                            <div key={code.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3 mb-2">
                                                <div>
                                                    <span className="font-mono text-purple-400 text-lg font-bold">{code.code}</span>
                                                    <span className="text-gray-500 text-xs mx-3">{code.role === 'employee' ? `👤 ${tx.employee}` : `🏢 ${tx.deptHead}`}</span>
                                                </div>
                                                <button onClick={() => navigator.clipboard.writeText(code.code)} className="text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded border border-purple-800">{tx.copy}</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <h3 className="font-medium mb-4">{tx.members} ({members.length})</h3>
                            {members.map(member => (
                                <div key={member.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                                    <div>
                                        <p className="font-medium text-sm">{member.full_name}</p>
                                        <p className="text-xs text-gray-500">{roleLabel(member.role)}</p>
                                    </div>
                                    {profile?.role === 'owner' && member.id !== user?.id && (
                                        <button onClick={() => handleRemoveMember(member.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-800">{tx.remove}</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}