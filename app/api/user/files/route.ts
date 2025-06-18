import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient(req);

    const { data: files, error } = await supabase
      .from('message_documents')
      .select(`
        id,
        document_url,
        name,
        file_type,
        size,
        created_at,
        messages!inner (
          id,
          conversation_id,
          conversations!inner (
            user_id
          )
        )
      `)
      .eq('messages.conversations.user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Files fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      files: files || [],
      total_count: files?.length || 0
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.error('Files GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}