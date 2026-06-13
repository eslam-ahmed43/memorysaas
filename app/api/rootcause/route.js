import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateAnswer, generateEmbedding } from '@/lib/gemini'
import { searchMemories } from '@/lib/qdrant'
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

    const { company_id, event } = await request.json()

    if (!company_id || !event) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const [timelineRes, decisionsRes, companyRes] = await Promise.all([
        supabase.from('timeline_events').select('*').eq('company_id', company_id).order('event_date', { ascending: false }).limit(20),
        supabase.from('decisions').select('*').eq('company_id', company_id).order('created_at', { ascending: false }).limit(10),
        supabase.from('companies').select('language').eq('id', company_id).single()
    ])

    const isArabic = companyRes.data?.language !== 'en'
    const lang = isArabic ? 'Arabic' : 'English'

    const embedding = await generateEmbedding(event)
    const relatedMemories = await searchMemories(embedding, company_id, 5)
    const context = relatedMemories.map(m => m.payload.content).join('\n\n')

    const prompt = `You are a Root Cause Analysis expert. Analyze why the following event happened.

Event to analyze: "${event}"

Company Timeline:
${timelineRes.data?.map(e => `- ${e.title}: ${e.description}`).join('\n') || 'None'}

Recent Decisions:
${decisionsRes.data?.map(d => `- ${d.title}: ${d.description}`).join('\n') || 'None'}

Related Documents Context:
${context || 'No related documents found'}

Provide a deep root cause analysis in ${lang} only.

Return JSON only with no extra text:
{
  "immediate_cause": "what directly caused this",
  "root_causes": [
    {
      "cause": "root cause description",
      "evidence": "evidence from data",
      "depth": "surface"
    }
  ],
  "contributing_factors": ["factor 1", "factor 2"],
  "chain_of_events": ["step 1", "step 2", "step 3"],
  "prevention_recommendations": ["recommendation 1", "recommendation 2"],
  "confidence_level": "high",
  "confidence_reason": "reason for confidence level"
}`

    try {
        const response = await generateAnswer(prompt)
        const clean = response.replace(/```json|```/g, '').trim()
        const analysis = JSON.parse(clean)
        return NextResponse.json({ success: true, analysis })
    } catch (e) {
        return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
    }
}