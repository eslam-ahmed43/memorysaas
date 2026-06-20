import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    const { data } = await supabase
        .from('company_kpis')
        .select('*')
        .eq('company_id', companyId)
        .order('date', { ascending: false })

    return NextResponse.json({ kpis: data || [] })
}

export async function POST(request) {
    const supabase = getSupabaseAdmin()
    const { company_id, name, value, previous_value, unit } = await request.json()

    if (!company_id || !name || value === undefined) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('company_kpis')
        .insert({ company_id, name, value, previous_value, unit })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, kpi: data })
}

export async function DELETE(request) {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await supabase.from('company_kpis').delete().eq('id', id)
    return NextResponse.json({ success: true })
}