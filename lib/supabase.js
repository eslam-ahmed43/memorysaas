import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
        cookieOptions: {
            name: 'sb',
            lifetime: 60 * 60 * 8,
            domain: 'memorysaas-qjg3.vercel.app',
            path: '/',
            sameSite: 'lax',
        },
        auth: {
            flowType: 'pkce',
            detectSessionInUrl: true,
            persistSession: true,
            storage: {
                getItem: (key) => {
                    if (typeof document === 'undefined') return null
                    const cookies = document.cookie.split(';')
                    const cookie = cookies.find(c => c.trim().startsWith(key + '='))
                    return cookie ? decodeURIComponent(cookie.split('=')[1]) : null
                },
                setItem: (key, value) => {
                    if (typeof document === 'undefined') return
                    document.cookie = `${key}=${encodeURIComponent(value)};path=/;domain=memorysaas-qjg3.vercel.app;samesite=lax;secure;max-age=${60 * 60 * 8}`
                },
                removeItem: (key) => {
                    if (typeof document === 'undefined') return
                    document.cookie = `${key}=;path=/;domain=memorysaas-qjg3.vercel.app;max-age=0`
                }
            }
        }
    }
)