import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

const inviteRequests = new Map()

function rateLimit(ip, limit = 10, windowMs = 60000) {
    const now = Date.now()
    const windowStart = now - windowMs
    if (!inviteRequests.has(ip)) inviteRequests.set(ip, [])
    const reqs = inviteRequests.get(ip).filter(t => t > windowStart)
    reqs.push(now)
    inviteRequests.set(ip, reqs)
    return reqs.length <= limit
}

function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request) {
    const supabaseAdmin = getSupabaseAdmin()
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        if (!rateLimit(ip)) {
            return NextResponse.json({ error: 'طلبات كثيرة جداً' }, { status: 429 })
        }

        const { company_id, role, department_id, created_by } = await request.json()

        if (!company_id || !company_id.match(/^[0-9a-f-]{36}$/)) {
            return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 })
        }

        const validRoles = ['employee', 'dept_head']
        if (role && !validRoles.includes(role)) {
            return NextResponse.json({ error: 'صلاحية غير صحيحة' }, { status: 400 })
        }

        const code = generateCode()

        const { data, error } = await supabaseAdmin
            .from('invite_codes')
            .insert({
                company_id,
                role: role || 'employee',
                department_id: department_id || null,
                code,
                created_by,
                max_uses: 1
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: 'خطأ في إنشاء الكود' }, { status: 400 })
        return NextResponse.json({ success: true, code: data.code })
    } catch (error) {
        console.error('Invite POST error:', error.message)
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
    }
}

export async function GET(request) {
    const supabaseAdmin = getSupabaseAdmin()
    try {
        const { searchParams } = new URL(request.url)
        const companyId = searchParams.get('company_id')

        if (!companyId || !companyId.match(/^[0-9a-f-]{36}$/)) {
            return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 })
        }

        const { data } = await supabaseAdmin
            .from('invite_codes')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })

        return NextResponse.json({ codes: data || [] })
    } catch (error) {
        console.error('Invite GET error:', error.message)
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
    }
}

export async function PUT(request) {
    const supabaseAdmin = getSupabaseAdmin()
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        if (!rateLimit(ip)) {
            return NextResponse.json({ error: 'محاولات كثيرة جداً' }, { status: 429 })
        }

        const { code, email, password, full_name } = await request.json()

        if (!code || code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
            return NextResponse.json({ error: 'كود غير صحيح' }, { status: 400 })
        }

        if (!email || !validateEmail(email)) {
            return NextResponse.json({ error: 'البريد الإلكتروني غير صحيح' }, { status: 400 })
        }

        if (!password || password.length < 8) {
            return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 })
        }

        const { data: inviteData, error: inviteError } = await supabaseAdmin
            .from('invite_codes')
            .select('*')
            .eq('code', code.toUpperCase())
            .single()

        if (inviteError || !inviteData) {
            return NextResponse.json({ error: 'كود غير صحيح أو منتهي' }, { status: 400 })
        }

        if (inviteData.used_count >= inviteData.max_uses) {
            return NextResponse.json({ error: 'هذا الكود تم استخدامه من قبل' }, { status: 400 })
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email.toLowerCase().trim(),
            password,
            email_confirm: true,
        })

        if (authError) return NextResponse.json({ error: 'البريد الإلكتروني مسجل بالفعل' }, { status: 400 })

        await supabaseAdmin.from('profiles').insert({
            id: authData.user.id,
            company_id: inviteData.company_id,
            department_id: inviteData.department_id,
            full_name: (full_name || email.split('@')[0]).substring(0, 100),
            role: inviteData.role,
        })

        await supabaseAdmin.from('invite_codes').delete().eq('id', inviteData.id)

        return NextResponse.json({ success: true, company_id: inviteData.company_id })
    } catch (error) {
        console.error('Invite PUT error:', error.message)
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
    }
}