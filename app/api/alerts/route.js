import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    if (!companyId || !companyId.match(/^[0-9a-f-]{36}$/)) {
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

    return NextResponse.json({ alerts: alerts || [] })
}

export async function PUT(request) {
    const supabase = getSupabaseAdmin()
    const { id } = await request.json()

    await supabase.from('alerts').update({ status: 'resolved' }).eq('id', id)
    return NextResponse.json({ success: true })
}