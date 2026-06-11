import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

function generateInviteCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(request) {
    const supabaseAdmin = getSupabaseAdmin()
    try {
        const { user_id, email, company_name, industry, country, language, company_size } = await request.json()

        if (!user_id || !company_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const slug = company_name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()

        const { data: company, error: companyError } = await supabaseAdmin
            .from('companies')
            .insert({
                name: company_name,
                slug,
                industry,
                country,
                language,
                company_size,
            })
            .select()
            .single()

        if (companyError) return NextResponse.json({ error: companyError.message }, { status: 400 })

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: user_id,
                company_id: company.id,
                full_name: email?.split('@')[0] || 'Owner',
                role: 'owner',
            })

        if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

        const inviteCode = generateInviteCode()
        await supabaseAdmin.from('invite_codes').insert({
            company_id: company.id,
            code: inviteCode,
            role: 'employee',
            created_by: user_id,
        })

        return NextResponse.json({ success: true, company, invite_code: inviteCode })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}