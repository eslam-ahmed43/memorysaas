import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateEmbedding, generateAnswer } from '@/lib/gemini'
import { searchMemories } from '@/lib/qdrant'
import { NextResponse } from 'next/server'

const requests = new Map()

function rateLimit(ip, limit = 30, windowMs = 60000) {
    const now = Date.now()
    const windowStart = now - windowMs
    if (!requests.has(ip)) requests.set(ip, [])
    const userRequests = requests.get(ip).filter(time => time > windowStart)
    userRequests.push(now)
    requests.set(ip, userRequests)
    return userRequests.length <= limit
}

export async function POST(request) {
    const supabaseAdmin = getSupabaseAdmin()
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        if (!rateLimit(ip)) {
            return NextResponse.json({ error: 'طلبات كثيرة جداً، انتظر دقيقة' }, { status: 429 })
        }

        const body = await request.json()
        const { question, company_id, user_id } = body

        if (!question || !company_id) {
            return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
        }

        if (question.length > 1000) {
            return NextResponse.json({ error: 'السؤال طويل جداً' }, { status: 400 })
        }

        const questionEmbedding = await generateEmbedding(question)
        const relevantMemories = await searchMemories(questionEmbedding, company_id, 5)

        if (relevantMemories.length === 0) {
            return NextResponse.json({
                answer: 'لم أجد معلومات كافية للإجابة على هذا السؤال. يرجى رفع المزيد من الوثائق.',
                sources: [],
            })
        }

        const context = relevantMemories
            .map((m, i) => `[${i + 1}] من وثيقة "${m.payload.document_name}":\n${m.payload.content}`)
            .join('\n\n')

        const prompt = `أنت مساعد ذكي لذاكرة الشركة. استخدم المعلومات التالية للإجابة على السؤال.

المعلومات المتاحة:
${context}

السؤال: ${question}

أجب بشكل واضح ومفصل باللغة العربية أو الإنجليزية حسب لغة السؤال.
اذكر المصادر التي اعتمدت عليها في إجابتك.`

        const answer = await generateAnswer(prompt)

        if (user_id && company_id) {
            await supabaseAdmin.from('conversations').insert({
                company_id,
                user_id,
                question,
                answer,
            })
        }

        const sources = relevantMemories.map((m) => ({
            document_name: m.payload.document_name,
            content: m.payload.content.substring(0, 200),
            score: m.score,
        }))

        return NextResponse.json({ answer, sources })
    } catch (error) {
        console.error('Chat error:', error.message)
        return NextResponse.json({ error: 'حدث خطأ في المعالجة' }, { status: 500 })
    }
}

export async function GET(request) {
    const supabaseAdmin = getSupabaseAdmin()
    try {
        const { searchParams } = new URL(request.url)
        const companyId = searchParams.get('company_id')

        if (!companyId) {
            return NextResponse.json({ error: 'company_id مطلوب' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('conversations')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) return NextResponse.json({ error: 'خطأ في جلب البيانات' }, { status: 400 })
        return NextResponse.json({ conversations: data })
    } catch (error) {
        console.error('Chat GET error:', error.message)
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
    }
}