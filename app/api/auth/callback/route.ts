import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
      const host = request.headers.get('host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      let redirectUrl: string
      
      if (isLocalEnv) {
        // Trust localhost
        redirectUrl = `${origin}${next}`
      } else if (forwardedHost) {
        // Use forwarded host (from load balancer)
        redirectUrl = `${forwardedProto}://${forwardedHost}${next}`
      } else if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        // Use the host header if it's not localhost
        redirectUrl = `https://${host}${next}`
      } else {
        // Fallback to environment variable or origin
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
        if (siteUrl) {
          const baseUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
          redirectUrl = `${baseUrl}${next}`
        } else {
          redirectUrl = `${origin}${next}`
        }
      }
      
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Return the user to an error page with instructions
  // Use the same logic for error redirect
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  
  let errorRedirectUrl: string
  
  if (isLocalEnv) {
    errorRedirectUrl = `${origin}/auth/auth-code-error`
  } else if (forwardedHost) {
    errorRedirectUrl = `${forwardedProto}://${forwardedHost}/auth/auth-code-error`
  } else if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    errorRedirectUrl = `https://${host}/auth/auth-code-error`
  } else {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    if (siteUrl) {
      const baseUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
      errorRedirectUrl = `${baseUrl}/auth/auth-code-error`
    } else {
      errorRedirectUrl = `${origin}/auth/auth-code-error`
    }
  }
  
  return NextResponse.redirect(errorRedirectUrl)
}