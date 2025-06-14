import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        req.cookies.set(name, value)
                        res.cookies.set(name, value, options)
                    })
                },
            },
        }
    )
    
    // Use getUser() instead of getSession() for security - per Supabase docs
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // Handle API route authentication
    if (req.nextUrl.pathname.startsWith('/api/')) {
        // For API routes that require authentication
        const protectedApiRoutes = ['/api/conversations', '/api/chat']
        const isProtectedRoute = protectedApiRoutes.some(route => 
            req.nextUrl.pathname.startsWith(route)
        )
        
        if (isProtectedRoute && user) {
            // Add user ID to headers for API routes to use
            const requestHeaders = new Headers(req.headers)
            requestHeaders.set('x-user-id', user.id)
            requestHeaders.set('x-user-email', user.email || '')
            
            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                }
            })
        }
    }
    
    // For auth pages, redirect authenticated users to home
    if (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup')) {
        if (user) {
            return NextResponse.redirect(new URL('/', req.url))
        }
    }
    
    return res
}

// Ensure the middleware is only called for relevant paths
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)  
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}