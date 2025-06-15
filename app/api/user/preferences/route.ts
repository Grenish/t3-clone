import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Cache the schema validation
const userPreferencesSchema = z.object({
  display_name: z.string().max(50).optional(),
  occupation: z.string().max(100).optional(),
  traits: z.array(z.string()).max(50).optional(),
  additional_info: z.string().max(3000).optional(),
});

// Optimized Supabase client creation with connection pooling
let supabaseClient: any = null;

async function createSupabaseServerClient(request?: NextRequest) {
  // Reuse client instance for better performance
  if (supabaseClient) {
    return supabaseClient;
  }

  if (request) {
    supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Can't set cookies in API routes, but we can read them
          },
        },
      }
    )
  } else {
    const cookieStore = await cookies();
    supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );
  }
  
  return supabaseClient;
}

// Cache for user preferences (in-memory cache for 5 minutes)
const preferencesCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// GET - Fetch user preferences with caching
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(req);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Check cache first
    const cacheKey = `preferences_${user.id}`;
    const cached = preferencesCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ preferences: cached.data }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        }
      });
    }

    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to fetch preferences' }, 
        { status: 500 }
      );
    }

    const result = preferences || {
      display_name: null,
      occupation: null,
      traits: [],
      additional_info: null
    };

    // Cache the result
    preferencesCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json({ preferences: result }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
    
  } catch (error) {
    console.error('Preferences GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST - Create or update user preferences
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(req);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = userPreferencesSchema.parse(body);

    // Use upsert to create or update preferences
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...validatedData
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Preferences upsert error:', error);
      return NextResponse.json(
        { error: 'Failed to save preferences' }, 
        { status: 500 }
      );
    }

    // Clear cache for this user
    const cacheKey = `preferences_${user.id}`;
    preferencesCache.delete(cacheKey);

    return NextResponse.json({ 
      preferences,
      message: 'Preferences saved successfully'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors }, 
        { status: 400 }
      );
    }
    
    console.error('Preferences POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}