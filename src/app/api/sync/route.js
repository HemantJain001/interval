import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { getSupabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const DB_TABLE_NAME = 'interval_tracker';

// Factory to resolve the best Supabase client to use on the server side
function getServerSupabase(sessionToken) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // If we have a Service Role Key, we use it to bypass RLS policies on the server side
    // (safer, faster, avoids any token configuration issues)
    if (url && serviceRoleKey) {
        return createClient(url, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
    }

    // Otherwise, fall back to the user's signed JWT token to execute under their credentials
    return getSupabase(sessionToken);
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const supabase = getServerSupabase(session.supabaseAccessToken);

        if (!supabase) {
            return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
        }

        const { data, error } = await supabase
            .from(DB_TABLE_NAME)
            .select('state')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error('[Sync API] Select error details:', error);
            throw error;
        }

        return NextResponse.json({ state: data?.state || null });
    } catch (err) {
        console.error('[Sync API] Pull error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { state } = await request.json();
        
        if (!state) {
            return NextResponse.json({ error: 'State payload is required' }, { status: 400 });
        }

        const supabase = getServerSupabase(session.supabaseAccessToken);

        if (!supabase) {
            return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
        }

        const { error } = await supabase
            .from(DB_TABLE_NAME)
            .upsert({
                id: userId,
                state: state,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('[Sync API] Upsert error details:', error);
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[Sync API] Push error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
