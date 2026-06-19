import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(request) {
    const supabase = getSupabaseAdmin()

    try {
        const { email, otp } = await request.json()

        if (!email || !otp) {
            return NextResponse.json({ error: 'Missing email or OTP' }, { status: 400 })
        }

        const emailLower = email.toLowerCase().trim()

        // Get OTP from DB
        const { data: otpRecord, error } = await supabase
            .from('email_otps')
            .select('*')
            .eq('email', emailLower)
            .eq('otp', otp)
            .eq('used', false)
            .single()

        if (error || !otpRecord) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
        }

        // Check expiry
        if (new Date() > new Date(otpRecord.expires_at)) {
            await supabase.from('email_otps').delete().eq('id', otpRecord.id)
            return NextResponse.json({ error: 'OTP expired' }, { status: 400 })
        }

        // Mark OTP as used
        await supabase.from('email_otps').update({ used: true }).eq('id', otpRecord.id)

        // Create or get user
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === emailLower)

        let userId

        if (existingUser) {
            userId = existingUser.id
        } else {
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: emailLower,
                email_confirm: true,
            })
            if (createError) {
                return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
            }
            userId = newUser.user.id
        }

        // Generate magic link for session
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: emailLower,
        })

        if (linkError) {
            return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            userId,
            token_hash: linkData.properties?.hashed_token,
            action_link: linkData.properties?.action_link,
        })
    } catch (error) {
        console.error('Verify OTP error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}