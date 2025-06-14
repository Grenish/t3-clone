import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// Request validation schemas
const createConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
});

const generateTitleSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt too long'),
});

async function createSupabaseServerClient(request?: NextRequest) {
  if (request) {
    // For middleware/API route usage
    return createServerClient(
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
    // For server components
    const cookieStore = await cookies();
    return createServerClient(
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
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
  }
}

// Helper function to generate conversation title using AI
async function generateConversationTitle(userPrompt: string): Promise<string> {
  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

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
    // Create Supabase client
    const supabase = await createSupabaseServerClient(req);
    
    // Use getUser() instead of getSession() for security - per Supabase docs
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    // The RLS policies will automatically filter by user_id = auth.uid()
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch conversations',
          details: error.message 
        }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      conversations: conversations || [],
      count: conversations?.length || 0
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createSupabaseServerClient(req);
    
    // Use getUser() instead of getSession() for security - per Supabase docs
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

    // Insert conversation - explicitly set user_id
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        title: validatedData.title,
        user_id: user.id, // Explicitly set user_id
      })
      .select()
      .single();

    if (error) {
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
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// PUT endpoint to generate and update conversation title
export async function PUT(req: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createSupabaseServerClient(req);
    
    // Use getUser() instead of getSession() for security
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
    
    // Generate title using AI
    const generatedTitle = await generateConversationTitle(prompt);
    
    // Update the conversation with the generated title
    const { data: conversation, error } = await supabase
      .from('conversations')
      .update({ title: generatedTitle })
      .eq('id', conversationId)
      .eq('user_id', user.id) // Ensure user owns the conversation
      .select()
      .single();

    if (error) {
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

    return NextResponse.json({ 
      conversation,
      title: generatedTitle,
      message: 'Title generated and updated successfully'
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}