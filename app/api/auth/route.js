import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

const authRequests = new Map()

function rateLimit(ip, limit = 5, windowMs = 300000) {
    const now = Date.now()
    const windowStart = now - windowMs
    if (!authRequests.has(ip)) authRequests.set(ip, [])
    const reqs = authRequests.get(ip).filter(t => t > windowStart)
    reqs.push(now)
    authRequests.set(ip, reqs)
    return reqs.length <= limit
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePassword(password) {
    return password && password.length >= 8
}

export async function POST(request) {
    const supabase = getSupabaseAdmin()
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        if (!rateLimit(ip)) {
            return NextResponse.json({ error: 'محاولات كثيرة جداً، انتظر 5 دقائق' }, { status: 429 })
        }

        const body = await request.json()
        const { action, email, password, companyName } = body

        if (!email || !validateEmail(email)) {
            return NextResponse.json({ error: 'البريد الإلكتروني غير صحيح' }, { status: 400 })
        }

        if (!validatePassword(password)) {
            return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 })
        }

        if (action === 'signup') {
            if (!companyName || companyName.trim().length < 2) {
                return NextResponse.json({ error: 'اسم الشركة يجب أن يكون حرفين على الأقل' }, { status: 400 })
            }

            if (companyName.length > 100) {
                return NextResponse.json({ error: 'اسم الشركة طويل جداً' }, { status: 400 })
            }

            const { data: existingUser } = await supabase.auth.admin.listUsers()
            const userExists = existingUser?.users?.some(u => u.email === email)
            if (userExists) {
                return NextResponse.json({ error: 'البريد الإلكتروني مسجل بالفعل' }, { status: 400 })
            }

            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: email.toLowerCase().trim(),
                password,
                email_confirm: true,
            })

            if (authError) return NextResponse.json({ error: 'خطأ في إنشاء الحساب' }, { status: 400 })

            return NextResponse.json({ success: true, user_id: authData.user.id })
        }

        if (action === 'login') {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password
            })
            if (error) return NextResponse.json({ error: 'البريد أو كلمة المرور غير صحيحة' }, { status: 400 })
            return NextResponse.json({ success: true, data })
        }

        return NextResponse.json({ error: 'طلب غير صحيح' }, { status: 400 })
    } catch (error) {
        console.error('Auth error:', error.message)
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
    }
}