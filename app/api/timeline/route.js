import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { generateAnswer } from '@/lib/gemini'

export async function GET(request) {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    const { data: events } = await supabaseAdmin
        .from('timeline_events')
        .select('*')
        .eq('company_id', companyId)
        .order('event_date', { ascending: false })
        .limit(50)

    return NextResponse.json({ events: events || [] })
}

export async function POST(request) {
    const supabaseAdmin = getSupabaseAdmin()
    try {
        const { company_id, title, description, event_date, source_document_id } = await request.json()

        const { data, error } = await supabaseAdmin
            .from('timeline_events')
            .insert({ company_id, title, description, event_date, source_document_id })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ success: true, event: data })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}