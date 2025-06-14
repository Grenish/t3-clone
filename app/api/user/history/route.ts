import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

async function createSupabaseServerClient(request?: NextRequest) {
  if (request) {
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
            }
          },
        },
      }
    );
  }
}

// GET - Export user conversation history
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
      .order('created_at', { ascending: false });

    if (convError) {
      return NextResponse.json(
        { error: 'Failed to export conversation history' }, 
        { status: 500 }
      );
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Prepare export data
    const exportData = {
      export_info: {
        user_id: user.id,
        user_email: user.email,
        export_date: new Date().toISOString(),
        total_conversations: conversations?.length || 0,
        total_messages: conversations?.reduce((acc, conv) => acc + (conv.messages?.length || 0), 0) || 0
      },
      user_preferences: preferences || null,
      conversations: conversations || []
    };

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `chat-history-export-${timestamp}.json`;

    // Return as downloadable file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// DELETE - Delete all conversation history
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(req);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

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
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}