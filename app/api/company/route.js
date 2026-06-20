import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function PUT(request) {
    const supabase = getSupabaseAdmin()
    const { company_id, name, industry, language, country } = await request.json()

    if (!company_id) return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })

    const { data, error } = await supabase
        .from('companies')
        .update({ name, industry, language, country })
        .eq('id', company_id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, company: data })
}