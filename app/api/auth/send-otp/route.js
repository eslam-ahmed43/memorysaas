import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request) {
    const supabase = getSupabaseAdmin()

    try {
        const { email } = await request.json()

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
        }

        const emailLower = email.toLowerCase().trim()
        const otp = generateOTP()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Delete old OTPs for this email
        await supabase.from('email_otps').delete().eq('email', emailLower)

        // Save new OTP
        const { error: dbError } = await supabase.from('email_otps').insert({
            email: emailLower,
            otp,
            expires_at: expiresAt.toISOString(),
        })

        if (dbError) {
            console.error('DB error:', dbError)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        // Send email via Resend
        const { error: emailError } = await resend.emails.send({
            from: 'MemoryOS <onboarding@resend.dev>',
            to: emailLower,
            subject: 'Your MemoryOS Verification Code',
            html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f0f;color:#fff;border-radius:16px;">
          <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:40px;">🧠</span>
            <h1 style="color:#a855f7;margin:8px 0;">MemoryOS</h1>
          </div>
          <p style="color:#9ca3af;margin-bottom:8px;">Your verification code:</p>
          <div style="background:#1f1f1f;border:2px solid #a855f7;border-radius:12px;padding:24px;text-align:center;margin:16px 0;">
            <span style="font-size:48px;font-weight:bold;letter-spacing:12px;color:#fff;">${otp}</span>
          </div>
          <p style="color:#6b7280;font-size:14px;text-align:center;">This code expires in 10 minutes.</p>
          <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:24px;">If you didn't request this, ignore this email.</p>
        </div>
      `
        })

        if (emailError) {
            console.error('Email error:', emailError)
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'OTP sent' })
    } catch (error) {
        console.error('Send OTP error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}