import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateAnswer } from '@/lib/gemini'
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
        const { company_id, force_refresh } = body

        if (!company_id || !company_id.match(/^[0-9a-f-]{36}$/)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        if (!force_refresh) {
            const { data: cached } = await supabase
                .from('briefings')
                .select('intelligence_cache, cache_updated_at')
                .eq('company_id', company_id)
                .not('intelligence_cache', 'is', null)
                .order('cache_updated_at', { ascending: false })
                .limit(1)
                .single()

            if (cached?.intelligence_cache) {
                const cacheAge = Date.now() - new Date(cached.cache_updated_at).getTime()
                const oneHour = 60 * 60 * 1000
                if (cacheAge < oneHour) {
                    return NextResponse.json({ success: true, intelligence: cached.intelligence_cache, from_cache: true })
                }
            }
        }

        const [documentsRes, conversationsRes, timelineRes, membersRes, companyRes, decisionsRes, alertsRes] = await Promise.all([
            supabase.from('documents').select('name, created_at').eq('company_id', company_id).eq('status', 'completed'),
            supabase.from('conversations').select('question, created_at').eq('company_id', company_id).order('created_at', { ascending: false }).limit(10),
            supabase.from('timeline_events').select('title, description, event_date').eq('company_id', company_id).order('event_date', { ascending: false }).limit(15),
            supabase.from('profiles').select('full_name, role').eq('company_id', company_id),
            supabase.from('companies').select('language, name').eq('id', company_id).single(),
            supabase.from('decisions').select('title, description, status').eq('company_id', company_id).order('created_at', { ascending: false }).limit(10),
            supabase.from('alerts').select('title, severity, type').eq('company_id', company_id).eq('status', 'active').limit(10),
        ])

        const documents = documentsRes.data || []
        const conversations = conversationsRes.data || []
        const timeline = timelineRes.data || []
        const members = membersRes.data || []
        const decisions = decisionsRes.data || []
        const alerts = alertsRes.data || []
        const isArabic = companyRes.data?.language !== 'en'
        const lang = isArabic ? 'Arabic' : 'English'

        const knowledgeScore = Math.min(100, Math.round((documents.length * 10) + (timeline.length * 3)))
        const teamScore = Math.min(100, Math.round(members.length * 20))
        const activityScore = Math.min(100, Math.round((conversations.length * 5) + (decisions.length * 10)))
        const overallScore = Math.round((knowledgeScore + teamScore + activityScore) / 3)

        const companyContext = `
Company: ${companyRes.data?.name}
Team: ${members.length} members
Documents: ${documents.length}
Active Alerts: ${alerts.length}
Decisions: ${decisions.length}

Timeline:
${timeline.map(e => `- ${e.title}: ${e.description}`).join('\n') || 'None'}

Decisions:
${decisions.map(d => `- ${d.title} (${d.status}): ${d.description || ''}`).join('\n') || 'None'}

Alerts:
${alerts.map(a => `- [${a.severity}] ${a.title}`).join('\n') || 'None'}

Recent Questions:
${conversations.map(c => `- ${c.question}`).join('\n') || 'None'}
`

        const prompt = `You are a professional AI executive consultant. Analyze this company data and provide an accurate executive report in ${lang} only.

${companyContext}

RULES:
- Respond ONLY in ${lang}
- Be specific and evidence-based
- Base analysis ONLY on the data provided
- Return JSON only, no extra text

{
  "risks": [{"title": "...", "description": "...", "severity": "high/medium/low"}],
  "opportunities": [{"title": "...", "description": "..."}],
  "recommendations": [{"title": "...", "description": "...", "priority": "high/medium/low"}],
  "insights": [{"title": "...", "description": "..."}],
  "summary": "..."
}`

        const response = await generateAnswer(prompt)
        const clean = response.replace(/```json|```/g, '').trim()
        const analysis = JSON.parse(clean)

        const intelligence = {
            ...analysis,
            scores: { knowledge_score: knowledgeScore, team_score: teamScore, activity_score: activityScore, overall_score: overallScore },
            pipeline: 'gemini-3.5-flash',
            generated_at: new Date().toISOString()
        }

        const { data: existing } = await supabase
            .from('briefings')
            .select('id')
            .eq('company_id', company_id)
            .not('intelligence_cache', 'is', null)
            .limit(1)
            .single()

        if (existing) {
            await supabase.from('briefings').update({ intelligence_cache: intelligence, cache_updated_at: new Date().toISOString() }).eq('id', existing.id)
        } else {
            await supabase.from('briefings').insert({ company_id, type: 'intelligence', intelligence_cache: intelligence, cache_updated_at: new Date().toISOString() })
        }

        return NextResponse.json({ success: true, intelligence, from_cache: false })
    } catch (error) {
        console.error('Intelligence error:', error.message)
        return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
    }
}