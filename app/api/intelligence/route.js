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
    const supabaseAdmin = getSupabaseAdmin()
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        if (!rateLimit(ip)) {
            return NextResponse.json({ error: 'انتظر دقيقة قبل طلب تحليل جديد' }, { status: 429 })
        }

        const body = await request.json()
        const { company_id } = body

        if (!company_id || !company_id.match(/^[0-9a-f-]{36}$/)) {
            return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 })
        }

        const [documentsRes, conversationsRes, timelineRes, membersRes, companyRes] = await Promise.all([
            supabaseAdmin.from('documents').select('name, created_at').eq('company_id', company_id).eq('status', 'completed'),
            supabaseAdmin.from('conversations').select('question, answer, created_at').eq('company_id', company_id).order('created_at', { ascending: false }).limit(20),
            supabaseAdmin.from('timeline_events').select('title, description, event_date').eq('company_id', company_id).order('event_date', { ascending: false }).limit(20),
            supabaseAdmin.from('profiles').select('full_name, role, created_at').eq('company_id', company_id),
            supabaseAdmin.from('companies').select('language').eq('id', company_id).single()
        ])

        const documents = documentsRes.data
        const conversations = conversationsRes.data
        const timeline = timelineRes.data
        const members = membersRes.data
        const isArabic = companyRes.data?.language !== 'en'
        const lang = isArabic ? 'العربية الفصحى' : 'English'

        const prompt = `You are a professional AI executive consultant. Analyze the following company data and provide an accurate executive report in ${lang} only.

Company Data:
- Documents count: ${documents?.length || 0}
- Team members: ${members?.length || 0}
- Recorded events: ${timeline?.length || 0}

Latest Events:
${timeline?.map(e => `• ${e.title}: ${e.description}`).join('\n') || 'None'}

Uploaded Documents:
${documents?.map(d => `• ${d.name}`).join('\n') || 'None'}

Latest AI Conversations:
${conversations?.map(c => `• Question: ${c.question}`).join('\n') || 'None'}

Team Members:
${members?.map(m => `• ${m.full_name} - ${m.role === 'owner' ? (isArabic ? 'مالك' : 'Owner') : m.role === 'dept_head' ? (isArabic ? 'رئيس قسم' : 'Department Head') : (isArabic ? 'موظف' : 'Employee')}`).join('\n') || 'None'}

CRITICAL: Return JSON only, no extra text, in ${lang} language only, no English words if Arabic:
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

        const response = await generateAnswer(prompt)
        const cleanJson = response.replace(/```json|```/g, '').trim()
        const intelligence = JSON.parse(cleanJson)

        return NextResponse.json({ success: true, intelligence })
    } catch (error) {
        console.error('Intelligence error:', error.message)
        return NextResponse.json({ error: 'حدث خطأ في التحليل' }, { status: 500 })
    }
}