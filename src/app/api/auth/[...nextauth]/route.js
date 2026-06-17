import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Helper to create a service-role client for admin operations (like email to UUID lookup)
function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && serviceRoleKey) {
        return createClient(url, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    return null;
}

// Generate a stable, valid PostgreSQL UUID from an email address
function generateDeterministicUuid(email) {
    if (!email) return '00000000-0000-0000-0000-000000000000';
    
    // Hash the email to a 32-character hex string
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = (hash << 5) - hash + email.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    
    // Convert to hex and pad to 32 chars
    const baseHex = Math.abs(hash).toString(16).padEnd(8, 'a') + 
                    Math.abs(hash * 31).toString(16).padEnd(8, 'b') + 
                    Math.abs(hash * 97).toString(16).padEnd(8, 'c') + 
                    Math.abs(hash * 13).toString(16).padEnd(8, 'd');
    
    const hex = baseHex.substring(0, 32);
    
    // Format as 8-4-4-4-12 UUID
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, account, user }) {
            if (account && user) {
                token.rawUserId = user.id;
            }

            const email = token.email;
            let supabaseUserId = generateDeterministicUuid(email);

            // If we have the Service Role Key, check if a Supabase auth.users record exists for this email
            // to fetch their real Supabase Auth UUID (keeps data from previous version of the app).
            const adminSupabase = getAdminSupabase();
            if (adminSupabase && email) {
                try {
                    const { data: userData, error } = await adminSupabase.auth.admin.listUsers();
                    if (!error && userData && userData.users) {
                        const matchedUser = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
                        if (matchedUser) {
                            supabaseUserId = matchedUser.id;
                            console.log(`[NextAuth] Mapped email ${email} to existing Supabase UUID: ${supabaseUserId}`);
                        }
                    }
                } catch (err) {
                    console.error('[NextAuth] Supabase admin user lookup error:', err);
                }
            }

            token.supabaseUserId = supabaseUserId;

            // Generate Supabase Access Token signed with Supabase JWT Secret
            const jwtSecret = process.env.SUPABASE_JWT_SECRET;
            if (jwtSecret) {
                const payload = {
                    aud: 'authenticated',
                    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
                    sub: supabaseUserId,
                    email: email,
                    role: 'authenticated',
                    app_metadata: { provider: 'google', providers: ['google'] },
                    user_metadata: { email: email, name: token.name }
                };
                token.supabaseAccessToken = jwt.sign(payload, jwtSecret);
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.supabaseUserId;
                session.supabaseAccessToken = token.supabaseAccessToken;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
