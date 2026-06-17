import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Creates and returns a Supabase client.
 * If a custom NextAuth signed JWT token is passed, it configures
 * the client headers to authenticate via this token, bypassing
 * Supabase Auth client logins while respecting Row Level Security (RLS).
 */
export function getSupabase(token = null) {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('[Supabase] Missing URL or Publishable Key — running offline.');
        return null;
    }

    if (token) {
        return createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}
