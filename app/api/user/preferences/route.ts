import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Cache the schema validation
const userPreferencesSchema = z.object({
  display_name: z.string().max(50).optional(),
  occupation: z.string().max(100).optional(),
  traits: z.array(z.string()).max(50).optional(),
  additional_info: z.string().max(3000).optional(),
});

// Cache for user preferences (in-memory cache for 5 minutes)
const preferencesCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// GET - Fetch user preferences with caching
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient(req);
    
    // Check cache first
    const cacheKey = `preferences_${user.id}`;
    const cached = preferencesCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ preferences: cached.data });
    }

    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Preferences fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' }, 
        { status: 500 }
      );
    }

    // Cache the result (even if null)
    preferencesCache.set(cacheKey, { 
      data: preferences, 
      timestamp: Date.now() 
    });

    return NextResponse.json({ preferences });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
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
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient(req);

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
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    console.error('Preferences POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}