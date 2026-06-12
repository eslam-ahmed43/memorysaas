import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
        return NextResponse.redirect(`${origin}/login`)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const html = '<!DOCTYPE html><html><head><title>Authenticating...</title></head><body><p>Authenticating, please wait...</p><script>async function exchange() { const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2"); const supabase = createClient("' + supabaseUrl + '", "' + supabaseKey + '"); const { data, error } = await supabase.auth.exchangeCodeForSession("' + code + '"); if (error || !data.user) { window.location.href = "/login?error=auth"; return; } const res = await fetch("/api/profile?user_id=" + data.user.id); const profile = await res.json(); if (profile.profile) { window.location.href = "/dashboard"; } else { window.location.href = "/onboarding"; } } exchange();</script></body></html>'

    return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
    })
}