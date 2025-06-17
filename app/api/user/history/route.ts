import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Export user conversation history
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient(req);

    // Fetch all conversations with their messages
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        messages (
          id,
          role,
          content,
          model_used,
          token_usage,
          response_time_ms,
          status,
          metadata,
          created_at,
          message_images (
            image_url,
            alt_text,
            created_at
          ),
          message_documents (
            document_url,
            name,
            file_type,
            size,
            created_at
          )
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (convError) {
      console.error('Conversations fetch error:', convError);
      return NextResponse.json(
        { error: 'Failed to fetch conversation history' }, 
        { status: 500 }
      );
    }

    // Format the response for export
    const exportData = {
      user_id: user.id,
      export_date: new Date().toISOString(),
      total_conversations: conversations?.length || 0,
      conversations: conversations || []
    };

    return NextResponse.json({ 
      history: exportData,
      message: 'Conversation history exported successfully'
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    console.error('History GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// DELETE - Delete all conversation history
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient(req);

    // Delete all conversations (this will cascade to messages due to foreign key constraints)
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .eq('user_id', user.id);

    if (conversationsError) {
      return NextResponse.json(
        { error: 'Failed to delete conversation history' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'All conversation history deleted successfully'
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    console.error('History DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}