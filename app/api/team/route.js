import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    const { data: members } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

    return NextResponse.json({ members: members || [] })
}

export async function DELETE(request) {
    const supabaseAdmin = getSupabaseAdmin()
    const { user_id } = await request.json()

    await supabaseAdmin.from('profiles').delete().eq('id', user_id)
    await supabaseAdmin.auth.admin.deleteUser(user_id)

    return NextResponse.json({ success: true })
}