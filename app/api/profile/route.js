import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const supabaseAdmin = getSupabaseAdmin()
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('user_id')

        console.log('Looking for user:', userId)

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        console.log('Profile result:', profile, profileError)

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found', details: profileError }, { status: 404 })
        }

        const { data: company, error: companyError } = await supabaseAdmin
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single()

        console.log('Company result:', company, companyError)

        return NextResponse.json({ profile, company })
    } catch (err) {
        console.error('Profile API error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}