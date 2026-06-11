import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const token = request.cookies.get('sb-ieucicwqlnqiegnyaebz-auth-token')
    const { pathname } = request.nextUrl

    const protectedRoutes = ['/dashboard', '/onboarding']
    const authRoutes = ['/', '/join']

    const isProtected = protectedRoutes.some(route => pathname.startsWith(route))

    if (isProtected && !token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/onboarding/:path*']
}