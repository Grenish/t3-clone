import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const user = await requireAuth();
        const supabase = await createServerSupabaseClient(req);

        const { data: memory, error } = await supabase
            .from('user_memory')
            .select('id, memory_key, memory_value, memory_type, created_at, updated_at')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Memory fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch memory' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            memory: memory || [],
            total_count: memory?.length || 0
        });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Memory GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await requireAuth();
        const supabase = await createServerSupabaseClient(req);

        const { error } = await supabase
            .from('user_memory')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .eq('is_active', true);

        if (error) {
            console.error('Memory delete error:', error);
            return NextResponse.json(
                { error: 'Failed to delete memories' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'All memories deleted successfully'
        });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Memory DELETE error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}