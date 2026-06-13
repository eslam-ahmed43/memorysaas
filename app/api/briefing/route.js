import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateAnswer } from '@/lib/gemini'
import { NextResponse } from 'next/server'

const requests = new Map()
function rateLimit(ip, limit = 5, windowMs = 60000) {
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
    if (!rateLimit(ip)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const { company_id } = await request.json()

    if (!company_id || !company_id.match(/^[0-9a-f-]{36}$/)) {
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const [decisionsRes, alertsRes, timelineRes, companyRes] = await Promise.all([
        supabase.from('decisions').select('*').eq('company_id', company_id).order('created_at', { ascending: false }).limit(10),
        supabase.from('alerts').select('*').eq('company_id', company_id).eq('status', 'active').limit(10),
        supabase.from('timeline_events').select('*').eq('company_id', company_id).order('event_date', { ascending: false }).limit(10),
        supabase.from('companies').select('name, language').eq('id', company_id).single()
    ])

    const isArabic = companyRes.data?.language !== 'en'
    const lang = isArabic ? 'العربية' : 'English'

    const prompt = `You are an executive intelligence system. Generate a sharp weekly briefing in ${lang}.

Company: ${companyRes.data?.name}

Recent Decisions (${decisionsRes.data?.length || 0}):
${decisionsRes.data?.map(d => `- ${d.title}: ${d.status}`).join('\n') || 'None'}

Active Alerts (${alertsRes.data?.length || 0}):
${alertsRes.data?.map(a => `- [${a.severity}] ${a.title}`).join('\n') || 'None'}

Recent Events:
${timelineRes.data?.map(e => `- ${e.title}`).join('\n') || 'None'}

Return JSON only:
{
  "headline": "one sharp sentence summarizing the week",
  "top_priorities": [{"title": "...", "action": "...", "urgency": "high/medium/low"}],
  "decisions_summary": "brief summary of recent decisions",
  "alerts_summary": "brief summary of active alerts",
  "what_changed": ["change 1", "change 2"],
  "next_week_focus": ["focus 1", "focus 2"]
}`

    const response = await generateAnswer(prompt)
    const clean = response.replace(/\`\`\`json|\`\`\`/g, '').trim()
    const briefing = JSON.parse(clean)

    await supabase.from('briefings').insert({
        company_id,
        type: 'weekly',
        content: briefing,
    })

    return NextResponse.json({ success: true, briefing })
}

export async function GET(request) {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    const { data } = await supabase
        .from('briefings')
        .select('*')
        .eq('company_id', companyId)
        .order('generated_at', { ascending: false })
        .limit(5)

    return NextResponse.json({ briefings: data || [] })
}