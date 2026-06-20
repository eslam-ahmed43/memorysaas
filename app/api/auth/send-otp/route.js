import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(request) {
    const supabase = getSupabaseAdmin()
    try {
        const { email } = await request.json()
        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
        }
        const { error } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: email.toLowerCase().trim(),
            options: { shouldCreateUser: true }
        })
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}