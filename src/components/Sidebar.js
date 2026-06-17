'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppState } from '@/context/StateContext';
import { calculateStreak } from '@/utils/date';

export default function Sidebar() {
    const pathname = usePathname();
    const { state } = useAppState();

    const currentStreak = calculateStreak(state);

    return (
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <svg class="logo-icon" viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span class="logo-text">Interval</span>
                </div>
            </div>
            
            <nav class="sidebar-menu">
                <Link href="/" className={`menu-item ${pathname === '/' ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
                        <rect x="3" y="3" width="7" height="9"></rect>
                        <rect x="14" y="3" width="7" height="5"></rect>
                        <rect x="14" y="12" width="7" height="9"></rect>
                        <rect x="3" y="16" width="7" height="5"></rect>
                    </svg>
                    <span>Dashboard</span>
                </Link>
                <Link href="/striver" className={`menu-item ${pathname === '/striver' ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
                        <path d="M18 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"></path>
                        <path d="M8 7h8M8 11h8M8 15h5"></path>
                    </svg>
                    <span>Striver DSA Sheet</span>
                </Link>
                <Link href="/settings" className={`menu-item ${pathname === '/settings' ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span>Settings</span>
                </Link>
            </nav>

            <div class="sidebar-footer">
                <div class="streak-mini">
                    <svg class="streak-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 2C9.5 6.5 12 9.5 12 11.5C12 12.5 11.3 13.3 10.3 13.3C9.3 13.3 8.7 12.5 8.7 11.5C8.7 8.5 6 7 6 7C4.5 9.5 4 12.2 4 14C4 18.4 7.6 22 12 22C16.4 22 20 18.4 20 14C20 9.8 16 4 12 2Z"></path>
                    </svg>
                    <div class="streak-info">
                        <span class="streak-val" id="sidebarStreakVal">{currentStreak}</span>
                        <span class="streak-lbl">Day Streak</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
