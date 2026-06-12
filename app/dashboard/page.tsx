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

    async function loadIntelligence() {
        if (!profile) return
        setLoadingIntelligence(true)
        const res = await fetch('/api/intelligence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: profile.company_id })
        })
        const data = await res.json()
        if (data.intelligence) setIntelligence(data.intelligence)
        setLoadingIntelligence(false)
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
        if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الوثيقة؟' : 'Are you sure you want to delete this document?')) return
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
        if (!confirm(lang === 'ar' ? 'هل أنت متأكد من إزالة هذا العضو؟' : 'Are you sure you want to remove this member?')) return
        await fetch('/api/team', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        })
        setMembers(prev => prev.filter(m => m.id !== userId))
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
        profile?.role === 'owner' ||
        profile?.role === 'dept_head' ||
        doc.uploaded_by === user?.id

    const severityColor = (severity: string) => {
        if (severity === 'high') return 'text-red-400 bg-red-900/30 border-red-800'
        if (severity === 'medium') return 'text-yellow-400 bg-yellow-900/30 border-yellow-800'
        return 'text-green-400 bg-green-900/30 border-green-800'
    }

    const severityLabel = (severity: string) => {
        if (lang === 'ar') return severity === 'high' ? 'عالي' : severity === 'medium' ? 'متوسط' : 'منخفض'
        return severity === 'high' ? 'High' : severity === 'medium' ? 'Medium' : 'Low'
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
                    <span className="text-xs text-purple-400">{roleLabel(profile?.role)}</span>
                    <span className="text-sm text-gray-400">{user?.email}</span>
                    <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors">
                        {tx.logout}
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto p-6">
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: tx.documents, value: documents.length },
                        { label: tx.conversations, value: conversations.length },
                        { label: tx.events, value: timeline.length },
                        { label: tx.team, value: members.length },
                    ].map((stat, i) => (
                        <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold text-purple-400">{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 mb-6 flex-wrap">
                    {['chat', 'intelligence', 'documents', 'timeline', 'team'].map((tab) => (
                        <button key={tab} onClick={() => {
                            setActiveTab(tab)
                            if (tab === 'intelligence' && !intelligence) loadIntelligence()
                        }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                            {tab === 'chat' ? `💬 ${tx.askMemory}` :
                                tab === 'intelligence' ? `🎯 ${tx.intelligence}` :
                                    tab === 'documents' ? `📄 ${tx.documents}` :
                                        tab === 'timeline' ? `📅 ${lang === 'ar' ? 'التايم لاين' : 'Timeline'}` :
                                            `👥 ${tx.team}`}
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
                                <h3 className="text-gray-400 font-medium mb-3">
                                    {lang === 'ar' ? 'المحادثات السابقة' : 'Previous Conversations'}:
                                </h3>
                                {conversations.slice(0, 5).map((c) => (
                                    <div key={c.id} className="border-b border-gray-800 pb-3 mb-3 last:border-0">
                                        <p className="text-sm text-purple-400 mb-1">
                                            {lang === 'ar' ? 'س' : 'Q'}: {c.question}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            {lang === 'ar' ? 'ج' : 'A'}: {c.answer.substring(0, 150)}...
                                        </p>
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
                                            { label: lang === 'ar' ? 'مستوى المعرفة' : 'Knowledge Score', value: intelligence.scores.knowledge_score, color: 'purple' },
                                            { label: lang === 'ar' ? 'قوة الفريق' : 'Team Score', value: intelligence.scores.team_score, color: 'blue' },
                                            { label: lang === 'ar' ? 'مستوى النشاط' : 'Activity Score', value: intelligence.scores.activity_score, color: 'green' },
                                            { label: lang === 'ar' ? 'التقييم الكلي' : 'Overall Score', value: intelligence.scores.overall_score, color: 'yellow' },
                                        ].map((score, i) => (
                                            <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
                                                <div className="relative w-16 h-16 mx-auto mb-3">
                                                    <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#374151" strokeWidth="3" />
                                                        <circle cx="18" cy="18" r="15.9" fill="none"
                                                            stroke={score.color === 'purple' ? '#9333ea' : score.color === 'blue' ? '#3b82f6' : score.color === 'green' ? '#22c55e' : '#eab308'}
                                                            strokeWidth="3"
                                                            strokeDasharray={`${score.value} 100`}
                                                            strokeLinecap="round" />
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
                                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColor(risk.severity)}`}>
                                                            {severityLabel(risk.severity)}
                                                        </span>
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
                                        <h3 className="font-medium mb-4 text-yellow-400">💡 {tx.recommendations} ({intelligence.recommendations.length})</h3>
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
                                        <h3 className="font-medium mb-4 text-blue-400">🔍 {tx.insights} ({intelligence.insights.length})</h3>
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

                                <button onClick={loadIntelligence}
                                    className="w-full py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-purple-500 transition-all text-sm">
                                    🔄 {tx.refresh}
                                </button>
                            </>
                        ) : (
                            <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
                                <div className="text-4xl mb-4">🎯</div>
                                <h3 className="font-medium mb-2">{tx.intelligence}</h3>
                                <p className="text-gray-500 text-sm mb-6">{tx.uploadFirst}</p>
                                <button onClick={loadIntelligence}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all">
                                    {tx.analyze}
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
                                        <>
                                            <p className="text-gray-400 mb-1">
                                                {lang === 'ar' ? 'اضغط لرفع ملف' : 'Click to upload file'}
                                            </p>
                                            <p className="text-gray-600 text-sm">PDF, DOCX, TXT, XLSX, CSV, Code</p>
                                        </>
                                    )}
                                </div>
                                <input type="file" className="hidden"
                                    accept=".pdf,.docx,.txt,.xlsx,.xls,.csv,.py,.js,.ts,.tsx,.jsx,.cpp,.java,.html,.css"
                                    onChange={handleUpload} />
                            </label>
                        </div>
                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <h3 className="font-medium mb-4">{tx.documents} ({documents.length})</h3>
                            {documents.length === 0 ? <p className="text-gray-500 text-sm">{tx.noDocuments}</p> : (
                                documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                                        <div>
                                            <p className="font-medium text-sm">{doc.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(doc.created_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${doc.status === 'completed' ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>
                                                {doc.status === 'completed' ? tx.completed : tx.processing}
                                            </span>
                                            {canDelete(doc) && (
                                                <button onClick={() => handleDelete(doc.id)}
                                                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-800 hover:border-red-600 transition-colors">
                                                    {tx.delete}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <div className="space-y-4">
                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <h3 className="font-medium mb-6">
                                📅 {lang === 'ar' ? 'تاريخ الشركة' : 'Company Timeline'}
                            </h3>
                            {timeline.length === 0 ? (
                                <p className="text-gray-500 text-sm">{tx.uploadFirst}</p>
                            ) : (
                                <div className="relative">
                                    <div className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-0 bottom-0 w-0.5 bg-purple-800`} />
                                    {timeline.map((event, i) => (
                                        <div key={event.id} className={`flex gap-6 mb-6 relative ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold shrink-0 z-10">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-medium text-white text-sm">{event.title}</h4>
                                                    <span className="text-xs text-purple-400 shrink-0 mx-2">
                                                        {new Date(event.event_date).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}
                                                    </span>
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
                                    <select value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)}
                                        className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-purple-500">
                                        <option value="employee">👤 {tx.employee}</option>
                                        <option value="dept_head">🏢 {tx.deptHead}</option>
                                    </select>
                                    <button onClick={handleGenerateInvite} disabled={generatingCode}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all disabled:opacity-50">
                                        {generatingCode ? '...' : lang === 'ar' ? 'إنشاء كود' : 'Generate Code'}
                                    </button>
                                </div>
                                {inviteCodes.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-gray-400 text-sm mb-3">
                                            {lang === 'ar' ? 'أكواد الدعوة:' : 'Invite Codes:'}
                                        </p>
                                        {inviteCodes.slice(0, 5).map(code => (
                                            <div key={code.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3 mb-2">
                                                <div>
                                                    <span className="font-mono text-purple-400 text-lg font-bold">{code.code}</span>
                                                    <span className="text-gray-500 text-xs mx-3">
                                                        {code.role === 'employee' ? `👤 ${tx.employee}` : `🏢 ${tx.deptHead}`}
                                                    </span>
                                                </div>
                                                <button onClick={() => navigator.clipboard.writeText(code.code)}
                                                    className="text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded border border-purple-800">
                                                    {tx.copy}
                                                </button>
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
                                        <button onClick={() => handleRemoveMember(member.id)}
                                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-800">
                                            {tx.remove}
                                        </button>
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