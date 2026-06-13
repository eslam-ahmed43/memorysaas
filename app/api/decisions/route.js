import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateAnswer } from '@/lib/gemini'
import { NextResponse } from 'next/server'

const requests = new Map()
function rateLimit(ip, limit = 20, windowMs = 60000) {
    const now = Date.now()
    const windowStart = now - windowMs
    if (!requests.has(ip)) requests.set(ip, [])
    const reqs = requests.get(ip).filter(t => t > windowStart)
    reqs.push(now)
    requests.set(ip, reqs)
    return reqs.length <= limit
}

export async function GET(request) {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    if (!companyId || !companyId.match(/^[0-9a-f-]{36}$/)) {
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const { data: decisions } = await supabase
        .from('decisions')
        .select('*, profiles(full_name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

    return NextResponse.json({ decisions: decisions || [] })
}

export async function POST(request) {
    const supabase = getSupabaseAdmin()
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(ip)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const { company_id, title, description, made_by, evidence_document_ids } = await request.json()

    if (!company_id || !title) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: decision, error } = await supabase
        .from('decisions')
        .insert({ company_id, title, description, made_by, evidence_document_ids })
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Database error' }, { status: 400 })

    try {
        const prompt = `بناءً على هذا القرار: "${title}"
الوصف: "${description || 'لا يوجد'}"

استخرج:
1. الأسئلة المهمة التي يجب متابعتها
2. المخاطر المحتملة
3. الإجراءات المقترحة

أرجع JSON فقط:
{
  "follow_up_questions": ["سؤال 1", "سؤال 2"],
  "risks": ["خطر 1", "خطر 2"],
  "suggested_actions": ["إجراء 1", "إجراء 2"]
}`

        const response = await generateAnswer(prompt)
        const clean = response.replace(/\`\`\`json|\`\`\`/g, '').trim()
        const analysis = JSON.parse(clean)

        await supabase.from('alerts').insert({
            company_id,
            type: 'decision_risk',
            title: `مخاطر محتملة: ${title}`,
            description: analysis.risks?.join(', '),
            severity: 'medium',
            evidence: description,
        })

        return NextResponse.json({ success: true, decision, analysis })
    } catch (e) {
        return NextResponse.json({ success: true, decision })
    }
}

export async function PUT(request) {
    const supabase = getSupabaseAdmin()
    const { id, outcome, status, outcome_date } = await request.json()

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { data, error } = await supabase
        .from('decisions')
        .update({ outcome, status, outcome_date: outcome_date || new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Database error' }, { status: 400 })
    return NextResponse.json({ success: true, decision: data })
}