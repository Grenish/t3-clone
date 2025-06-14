import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schemas
const updateConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();
    
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Fetch conversation with RLS automatically filtering by user
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Conversation not found' }, 
        { status: 404 }
      );
    }

    // Fetch messages for this conversation (RLS will ensure user access)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      conversation, 
      messages: messages || [],
      messageCount: messages?.length || 0
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();
    
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    
    // Parse and validate request body
    const body = await req.json();
    const validatedData = updateConversationSchema.parse(body);

    // Update conversation (RLS will ensure user owns this conversation)
    const { data: conversation, error } = await supabase
      .from('conversations')
      .update({ title: validatedData.title })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      conversation,
      message: 'Conversation updated successfully'
    });
    
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();
    
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Delete conversation (RLS will ensure user owns this conversation)
    // Messages will be cascade deleted automatically
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Conversation deleted successfully'
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}