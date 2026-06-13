import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateAnswer } from '@/lib/gemini'
import { deepseekCritique } from '@/lib/deepseek'
import { NextResponse } from 'next/server'

const intelligenceRequests = new Map()

function rateLimit(ip, limit = 5, windowMs = 60000) {
    const now = Date.now()
    const windowStart = now - windowMs
    if (!intelligenceRequests.has(ip)) intelligenceRequests.set(ip, [])
    const reqs = intelligenceRequests.get(ip).filter(t => t > windowStart)
    reqs.push(now)
    intelligenceRequests.set(ip, reqs)
    return reqs.length <= limit
}

export async function POST(request) {
    const supabase = getSupabaseAdmin()
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        if (!rateLimit(ip)) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        }

        const body = await request.json()
        const { company_id } = body

        if (!company_id || !company_id.match(/^[0-9a-f-]{36}$/)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const [documentsRes, conversationsRes, timelineRes, membersRes, companyRes, decisionsRes, alertsRes] = await Promise.all([
            supabase.from('documents').select('name, created_at').eq('company_id', company_id).eq('status', 'completed'),
            supabase.from('conversations').select('question, answer, created_at').eq('company_id', company_id).order('created_at', { ascending: false }).limit(20),
            supabase.from('timeline_events').select('title, description, event_date').eq('company_id', company_id).order('event_date', { ascending: false }).limit(20),
            supabase.from('profiles').select('full_name, role, created_at').eq('company_id', company_id),
            supabase.from('companies').select('language, name').eq('id', company_id).single(),
            supabase.from('decisions').select('title, description, status').eq('company_id', company_id).order('created_at', { ascending: false }).limit(10),
            supabase.from('alerts').select('title, severity, type').eq('company_id', company_id).eq('status', 'active').limit(10),
        ])

        const documents = documentsRes.data
        const conversations = conversationsRes.data
        const timeline = timelineRes.data
        const members = membersRes.data
        const decisions = decisionsRes.data
        const alerts = alertsRes.data
        const isArabic = companyRes.data?.language !== 'en'
        const lang = isArabic ? 'Arabic' : 'English'

        const companyContext = `
Company: ${companyRes.data?.name}
Documents: ${documents?.length || 0}
Team: ${members?.length || 0}
Events: ${timeline?.length || 0}
Active Alerts: ${alerts?.length || 0}

Timeline:
${timeline?.map(e => `- ${e.title}: ${e.description}`).join('\n') || 'None'}

Decisions:
${decisions?.map(d => `- ${d.title} (${d.status}): ${d.description}`).join('\n') || 'None'}

Active Alerts:
${alerts?.map(a => `- [${a.severity}] ${a.title}`).join('\n') || 'None'}

Recent Questions:
${conversations?.map(c => `- ${c.question}`).join('\n') || 'None'}
`

        const geminiPrompt = `You are a professional AI executive consultant. Analyze the following company data and provide an accurate executive report in ${lang} only.

${companyContext}

CRITICAL: Return JSON only, no extra text, in ${lang} language only:
{
  "risks": [{"title": "...", "description": "...", "severity": "high/medium/low"}],
  "opportunities": [{"title": "...", "description": "..."}],
  "recommendations": [{"title": "...", "description": "...", "priority": "high/medium/low"}],
  "insights": [{"title": "...", "description": "..."}],
  "summary": "...",
  "scores": {
    "knowledge_score": 0,
    "team_score": 0,
    "activity_score": 0,
    "overall_score": 0
  }
}`

        const geminiResponse = await generateAnswer(geminiPrompt)
        const geminiClean = geminiResponse.replace(/```json|```/g, '').trim()
        const geminiAnalysis = JSON.parse(geminiClean)

        let critique = null
        try {
            critique = await deepseekCritique(geminiAnalysis, companyContext)
        } catch (e) {
            console.log('DeepSeek critique skipped:', e.message)
        }

        const intelligence = {
            ...geminiAnalysis,
            critique,
            pipeline: 'gemini-deepseek-adversarial'
        }

        return NextResponse.json({ success: true, intelligence })
    } catch (error) {
        console.error('Intelligence error:', error.message)
        return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
    }
}