import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const createMessageSchema = z.object({
  conversation_id: z.string().uuid('Invalid conversation ID'),
  role: z.enum(['user', 'assistant', 'system', 'tool'], {
    errorMap: () => ({ message: 'Role must be one of: user, assistant, system, tool' })
  }),
  content: z.string().min(1, 'Content is required'),
  model_used: z.string().optional(),
  token_usage: z.number().int().positive().optional(),
  response_time_ms: z.number().int().positive().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']).optional().default('completed'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();
    
    const { id: conversationId } = await params;
    const supabase = await createServerSupabaseClient();
    
    // Parse and validate request body
    const body = await req.json();
    const validatedData = createMessageSchema.parse({
      ...body,
      conversation_id: conversationId, // Ensure conversation_id matches URL param
    });

    // First, verify that the conversation exists and user has access to it
    // RLS will automatically filter by user ownership
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single();

    if (conversationError) {
      if (conversationError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Conversation not found or access denied' }, 
          { status: 404 }
        );
      }
      
      console.error('Error verifying conversation:', conversationError);
      return NextResponse.json(
        { 
          error: 'Failed to verify conversation access',
          details: conversationError.message 
        }, 
        { status: 500 }
      );
    }

    // Insert message - RLS policies will ensure user has access to the conversation
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: validatedData.conversation_id,
        role: validatedData.role,
        content: validatedData.content,
        model_used: validatedData.model_used,
        token_usage: validatedData.token_usage,
        response_time_ms: validatedData.response_time_ms,
        status: validatedData.status,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      
      // Handle specific Supabase errors
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Access denied. Check conversation ownership.' }, 
          { status: 403 }
        );
      }
      
      if (error.code === '23503') { // Foreign key violation
        return NextResponse.json(
          { error: 'Invalid conversation ID' }, 
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create message',
          details: error.message 
        }, 
        { status: 500 }
      );
    }

    // Update conversation's updated_at timestamp
    // This will help keep the conversation at the top of the list
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (updateError) {
      // Log the error but don't fail the request since the message was created successfully
      console.warn('Failed to update conversation timestamp:', updateError);
    }

    return NextResponse.json({ 
      message,
      conversation_id: conversationId,
      success: 'Message created successfully'
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors 
        }, 
        { status: 400 }
      );
    }
    
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Optional: GET method to retrieve messages for a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();
    
    const { id: conversationId } = await params;
    const supabase = await createServerSupabaseClient();
    
    // Parse query parameters for pagination
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Validate pagination parameters
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' }, 
        { status: 400 }
      );
    }

    // Fetch messages with RLS automatically ensuring user access
    const { data: messages, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch messages',
          details: error.message 
        }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      messages: messages || [],
      count: count || 0,
      pagination: {
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}