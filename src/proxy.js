import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const authProxy = withAuth(
    function proxy(req) {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                // If the URL contains ?bypass=true or ?bypass, allow access without NextAuth credentials
                // (supports local offline testing mode)
                if (req.nextUrl.searchParams.has('bypass')) {
                    return true;
                }
                return !!token;
            },
        },
        pages: {
            signIn: '/login',
        },
    }
);

export function proxy(req, event) {
    return authProxy(req, event);
}

export const config = {
    // Protect these views, leaving /login and api routes unprotected
    matcher: ['/', '/striver', '/settings'],
};
