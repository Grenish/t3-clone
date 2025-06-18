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
        // Updated list of protected API routes (removed /api/chat)
        const protectedApiRoutes = [
            '/api/conversations', 
            '/api/user/preferences',
            '/api/user/history',
            '/api/user/account',
            '/api/user/files'
        ]
        
        const isProtectedRoute = protectedApiRoutes.some(route => 
            req.nextUrl.pathname.startsWith(route)
        )
        
        if (isProtectedRoute) {
            if (!user || error) {
                // Return 401 for unauthenticated requests to protected routes
                return new NextResponse(
                    JSON.stringify({ error: 'Authentication required' }),
                    { 
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    }
                )
            }
            
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
        
        // For chat API, add user info to headers if authenticated (but don't require it)
        if (req.nextUrl.pathname.startsWith('/api/chat')) {
            const requestHeaders = new Headers(req.headers)
            if (user) {
                requestHeaders.set('x-user-id', user.id)
                requestHeaders.set('x-user-email', user.email || '')
                requestHeaders.set('x-user-authenticated', 'true')
            } else {
                requestHeaders.set('x-user-authenticated', 'false')
            }
            
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