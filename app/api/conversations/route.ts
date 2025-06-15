import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// Request validation schemas
const createConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  initialMessage: z.string().optional(), // Add support for initial message
});

const generateTitleSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt too long'),
});

// Optimized Supabase client with connection reuse
let supabaseClientCache: any = null;

async function createSupabaseServerClient(request?: NextRequest) {
  // Reuse existing client for better performance
  if (supabaseClientCache) {
    return supabaseClientCache;
  }

  if (request) {
    supabaseClientCache = createServerClient(
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
    supabaseClientCache = createServerClient(
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
  
  return supabaseClientCache;
}

// Cache for conversations list (5 minutes)
const conversationsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Optimized AI client initialization
let googleAI: any = null;
function getGoogleAI() {
  if (!googleAI) {
    googleAI = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
  }
  return googleAI;
}

// Helper function to generate conversation title using AI
async function generateConversationTitle(userPrompt: string): Promise<string> {
  try {
    const google = getGoogleAI();
    const model = google("gemini-2.0-flash");

    const result = await generateText({
      model,
      prompt: `Generate a concise, descriptive title (maximum 6 words) for a conversation that starts with this user message: "${userPrompt}"

Rules:
- Keep it under 6 words
- Make it descriptive and specific
- Use title case (capitalize important words)
- Don't use quotes or special characters
- Focus on the main topic or request
- Examples:
  - "How to bake chocolate cookies" → "Chocolate Cookie Baking Guide"
  - "What's the weather in Paris?" → "Paris Weather Inquiry"
  - "Explain quantum physics basics" → "Quantum Physics Basics Explained"
  - "Generate image of sunset" → "Sunset Image Generation"

Title:`,
      maxTokens: 50,
    });

    let title = result.text.trim();
    
    // Clean up the title
    title = title.replace(/^["']|["']$/g, ''); // Remove quotes
    title = title.replace(/\n/g, ' '); // Replace newlines with spaces
    title = title.substring(0, 60); // Ensure it's not too long
    
    // Fallback if title is empty or too short
    if (title.length < 3) {
      title = generateFallbackTitle(userPrompt);
    }

    return title;
  } catch (error) {
    console.error('AI title generation failed:', error);
    return generateFallbackTitle(userPrompt);
  }
}

// Fallback title generation
function generateFallbackTitle(userPrompt: string): string {
  // Extract first few words and capitalize them
  const words = userPrompt.split(' ').slice(0, 6);
  let title = words.join(' ');
  
  // Capitalize first letter of each word
  title = title.replace(/\b\w/g, (char) => char.toUpperCase());
  
  // Truncate if too long
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }
  
  return title || 'New Chat';
}

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
    
    // Check if client is requesting fresh data (no-cache headers)
    const cacheControl = req.headers.get('cache-control');
    const shouldBypassCache = cacheControl?.includes('no-cache') || cacheControl?.includes('no-store');
    
    // Check cache first (only if not bypassing cache)
    const cacheKey = `conversations_${user.id}`;
    const cached = conversationsCache.get(cacheKey);
    
    if (!shouldBypassCache && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Serving conversations from cache');
      return NextResponse.json({ 
        conversations: cached.data,
        count: cached.data.length
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        }
      });
    }

    console.log('Fetching fresh conversations from database');
    
    // Optimized query with specific columns and limit
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100); // Limit to 100 most recent conversations

    if (error) {
      console.error('Conversations fetch error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch conversations',
          details: error.message 
        }, 
        { status: 500 }
      );
    }

    const result = conversations || [];
    
    // Cache the result (always update cache with fresh data)
    conversationsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    console.log(`Cached ${result.length} conversations for user ${user.id}`);

    return NextResponse.json({ 
      conversations: result,
      count: result.length
    }, {
      headers: {
        'Cache-Control': shouldBypassCache ? 'no-cache, no-store, must-revalidate' : 'public, s-maxage=60, stale-while-revalidate=300',
      }
    });
    
  } catch (error) {
    console.error('Conversations GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(req);
    
    // Add a small delay to ensure auth state is settled
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validatedData = createConversationSchema.parse(body);

    // Check if a conversation with the same title already exists recently (within last 30 seconds)
    // This helps prevent duplicate conversations during navigation
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    const { data: existingConversations, error: checkError } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .eq('title', validatedData.title)
      .gt('created_at', thirtySecondsAgo)
      .order('created_at', { ascending: false })
      .limit(1);
      
    // If we found a recent conversation with the same title, return it instead of creating a new one
    if (!checkError && existingConversations && existingConversations.length > 0) {
      console.log('Found existing conversation with same title, returning instead of creating duplicate');
      
      const { data: conversation } = await supabase
        .from('conversations')
        .select()
        .eq('id', existingConversations[0].id)
        .single();
        
      return NextResponse.json({ 
        conversation,
        message: 'Found existing conversation'
      }, { status: 200 });
    }

    // Insert conversation - explicitly set user_id
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        title: validatedData.title,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Conversation creation error:', error);
      // Handle specific Supabase errors
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Authentication required or RLS policy violation' }, 
          { status: 403 }
        );
      }
      
      if (error.code === '23503') { // Foreign key violation
        return NextResponse.json(
          { error: 'Invalid user reference' }, 
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create conversation',
          details: error.message 
        }, 
        { status: 500 }
      );
    }

    // Save initial message if provided
    if (validatedData.initialMessage && validatedData.initialMessage.trim()) {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: validatedData.initialMessage.trim(),
          status: 'completed'
        });

      if (messageError) {
        console.error('Initial message save error:', messageError);
        // Don't fail the conversation creation, just log the error
      }
    }

    // Clear cache for this user
    const cacheKey = `conversations_${user.id}`;
    conversationsCache.delete(cacheKey);

    return NextResponse.json({ 
      conversation,
      message: 'Conversation created successfully'
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors 
        }, 
        { status: 400 }
      );
    }
    
    console.error('Conversation POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// PUT endpoint to generate and update conversation title
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(req);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { prompt, conversationId } = body;
    
    if (!prompt || !conversationId) {
      return NextResponse.json(
        { error: 'Prompt and conversationId are required' }, 
        { status: 400 }
      );
    }
    
    // Generate title using AI (with timeout)
    const titlePromise = generateConversationTitle(prompt);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Title generation timeout')), 10000)
    );
    
    let generatedTitle: string;
    try {
      generatedTitle = await Promise.race([titlePromise, timeoutPromise]) as string;
    } catch (error) {
      console.error('Title generation failed, using fallback:', error);
      generatedTitle = generateFallbackTitle(prompt);
    }
    
    // Update the conversation with the generated title
    const { data: conversation, error } = await supabase
      .from('conversations')
      .update({ title: generatedTitle })
      .eq('id', conversationId)
      .eq('user_id', user.id) // Ensure user owns the conversation
      .select()
      .single();

    if (error) {
      console.error('Title update error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to update conversation title',
          details: error.message 
        }, 
        { status: 500 }
      );
    }

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' }, 
        { status: 404 }
      );
    }

    // Clear cache for this user
    const cacheKey = `conversations_${user.id}`;
    conversationsCache.delete(cacheKey);

    return NextResponse.json({ 
      conversation,
      title: generatedTitle,
      message: 'Title generated and updated successfully'
    });
    
  } catch (error) {
    console.error('Title generation PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}