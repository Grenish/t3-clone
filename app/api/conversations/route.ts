import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const createConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  initialMessage: z.string().optional(),
});

// Cache for conversations (in-memory cache for 5 minutes)
const conversationsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// GET - Fetch user conversations with caching
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient(req);
    
    // Check cache first
    const cacheKey = `conversations_${user.id}`;
    const cached = conversationsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ conversations: cached.data });
    }

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Conversations fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' }, 
        { status: 500 }
      );
    }

    // Cache the result
    conversationsCache.set(cacheKey, { 
      data: conversations, 
      timestamp: Date.now() 
    });

    return NextResponse.json({ conversations });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    console.error('Conversations GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient(req);
    
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
      .gte('created_at', thirtySecondsAgo);

    if (checkError) {
      console.warn('Error checking for existing conversations:', checkError);
      // Continue with creation even if check fails
    } else if (existingConversations && existingConversations.length > 0) {
      // Return the existing conversation
      return NextResponse.json({ 
        conversation: existingConversations[0],
        message: 'Using existing conversation'
      }, { status: 200 });
    }

    // Create new conversation
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
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    console.error('Conversation POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}