import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be defined in environment variables');
}

// Create a singleton pattern to prevent HMR issues
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

function createSupabaseClient() {
  if (typeof window === 'undefined') {
    // Server-side: always create new instance
    return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
  }
  
  // Client-side: use singleton to prevent HMR issues
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      cookies: {
        getAll() {
          return document.cookie
            .split('; ')
            .map(cookie => {
              const [name, ...rest] = cookie.split('=');
              return { name, value: rest.join('=') };
            })
            .filter(cookie => cookie.name);
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${value}`;
            
            if (options?.maxAge) {
              cookieString += `; Max-Age=${options.maxAge}`;
            }
            if (options?.domain) {
              cookieString += `; Domain=${options.domain}`;
            }
            if (options?.path) {
              cookieString += `; Path=${options.path}`;
            }
            if (options?.secure) {
              cookieString += '; Secure';
            }
            if (options?.httpOnly) {
              cookieString += '; HttpOnly';
            }
            if (options?.sameSite) {
              cookieString += `; SameSite=${options.sameSite}`;
            }
            
            document.cookie = cookieString;
          });
        },
      },
    });
  }
  
  return supabaseInstance;
}

export const supabase = createSupabaseClient();