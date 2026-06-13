import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateAnswer } from '@/lib/gemini'
import { NextResponse } from 'next/server'

const requests = new Map()

function rateLimit(ip, limit = 10, windowMs = 60000) {
    const now = Date.now()
    const windowStart = now - windowMs
    if (!requests.has(ip)) requests.set(ip, [])
    const reqs = requests.get(ip).filter(t => t > windowStart)
    reqs.push(now)
    requests.set(ip, reqs)
    return reqs.length <= limit
}

export async function POST(request) {
    const supabase = getSupabaseAdmin()
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(ip)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { company_id } = await request.json()

    if (!company_id || !company_id.match(/^[0-9a-f-]{36}$/)) {
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const [timelineRes, decisionsRes, alertsRes, docsRes, companyRes] = await Promise.all([
        supabase.from('timeline_events').select('*').eq('company_id', company_id).order('event_date', { ascending: false }).limit(20),
        supabase.from('decisions').select('*').eq('company_id', company_id).order('created_at', { ascending: false }).limit(10),
        supabase.from('alerts').select('*').eq('company_id', company_id).order('created_at', { ascending: false }).limit(10),
        supabase.from('documents').select('name, created_at').eq('company_id', company_id).order('created_at', { ascending: false }).limit(10),
        supabase.from('companies').select('language').eq('id', company_id).single()
    ])

    const isArabic = companyRes.data?.language !== 'en'
    const lang = isArabic ? 'Arabic' : 'English'

    const prompt = `You are a Company Intelligence System. Analyze all company data and detect meaningful changes.

Timeline Events:
${timelineRes.data?.map(e => `[${e.event_date?.split('T')[0]}] ${e.title}: ${e.description}`).join('\n') || 'None'}

Decisions Made:
${decisionsRes.data?.map(d => `[${d.created_at?.split('T')[0]}] ${d.title}: ${d.description} (${d.status})`).join('\n') || 'None'}

Active Alerts:
${alertsRes.data?.map(a => `[${a.severity}] ${a.title}`).join('\n') || 'None'}

Recent Documents:
${docsRes.data?.map(d => `${d.name} (${d.created_at?.split('T')[0]})`).join('\n') || 'None'}

Detect and analyze what has changed in the company. Respond in ${lang} only.

Return JSON only with no extra text:
{
  "summary": "one paragraph summary of what changed",
  "significant_changes": [
    {
      "title": "change title",
      "description": "what changed and why it matters",
      "impact": "positive/negative/neutral",
      "area": "operations/finance/team/clients/strategy"
    }
  ],
  "trends": [
    {
      "trend": "trend description",
      "direction": "improving/declining/stable",
      "evidence": "evidence for this trend"
    }
  ],
  "anomalies": [
    {
      "anomaly": "unusual pattern detected",
      "explanation": "why this is unusual",
      "action_needed": "what to do about it"
    }
  ],
  "stability_score": 0,
  "change_velocity": "high/medium/low"
}`

    try {
        const response = await generateAnswer(prompt)
        const clean = response.replace(/```json|```/g, '').trim()
        const analysis = JSON.parse(clean)
        return NextResponse.json({ success: true, analysis })
    } catch (e) {
        console.error('What changed error:', e)
        return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
    }
}