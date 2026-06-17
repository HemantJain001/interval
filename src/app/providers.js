'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { StateProvider } from '@/context/StateContext';

export function Providers({ children }) {
    return (
        <SessionProvider>
            <StateProvider>
                {children}
            </StateProvider>
        </SessionProvider>
    );
}
