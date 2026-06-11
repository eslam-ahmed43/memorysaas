import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(request) {
    const supabaseAdmin = getSupabaseAdmin()
    const { code } = await request.json()

    const { data, error } = await supabaseAdmin
        .from('invite_codes')
        .select('*, companies(name)')
        .eq('code', code.toUpperCase())
        .single()

    if (error || !data) {
        return NextResponse.json({ error: 'كود غير صحيح' }, { status: 400 })
    }

    if (data.used_count >= data.max_uses) {
        return NextResponse.json({ error: 'هذا الكود تم استخدامه من قبل' }, { status: 400 })
    }

    return NextResponse.json({
        valid: true,
        company_name: data.companies?.name,
        role: data.role
    })
}