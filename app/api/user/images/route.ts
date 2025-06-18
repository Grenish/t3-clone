import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const user = await requireAuth();
        const supabase = await createServerSupabaseClient(req);

        const { data: images, error } = await supabase.from('message_images').select(`
            id,
            image_url,
            alt_text,
            created_at,
            messages!inner (
                id,
                conversation_id,
                conversations!inner (
                    user_id,
                    title
                )
            )`
        ).eq('messages.conversations.user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Images fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch images' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            images: images || [],
            total_count: images?.length || 0
        });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Images GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}