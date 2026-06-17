'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const [theme, setTheme] = useState('dark');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    // ─── Path Name to View Title ─────────────────────────────────────────────
    const getPageTitle = () => {
        switch (pathname) {
            case '/':
                return 'Dashboard';
            case '/striver':
                return 'Striver DSA Sheet';
            case '/settings':
                return 'Settings';
            default:
                return 'Interval';
        }
    };

    // ─── Theme Management ──────────────────────────────────────────────────
    useEffect(() => {
        // Read theme from local storage
        const savedTheme = localStorage.getItem('interval-theme') || 'dark';
        setTheme(savedTheme);
        if (savedTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        localStorage.setItem('interval-theme', nextTheme);
        if (nextTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    };

    // ─── Dropdown Menu Close Handler ──────────────────────────────────────────
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ─── Display Constants ────────────────────────────────────────────────────
    const getLocalDateStr = () => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date().toLocaleDateString('en-US', options);
    };

    const getUserDisplayName = () => {
        if (!session?.user) return 'Guest User';
        return session.user.name || session.user.email?.split('@')[0] || 'User';
    };

    const getUserInitials = () => {
        const name = getUserDisplayName();
        const parts = name.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return '?';
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <header class="content-header">
            <div class="header-left">
                <h1 class="view-title" id="currentViewTitle">{getPageTitle()}</h1>
            </div>
            <div class="header-right">
                <div class="date-badge">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span id="currentDateString">{getLocalDateStr()}</span>
                </div>

                {/* Theme Toggle */}
                <button 
                    class="btn-theme-toggle" 
                    id="btnThemeToggle" 
                    aria-label="Toggle theme" 
                    title="Toggle light / dark mode"
                    onClick={toggleTheme}
                >
                    {theme === 'dark' ? (
                        <svg class="icon-moon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"></path>
                        </svg>
                    ) : (
                        <svg class="icon-sun" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                    )}
                </button>

                {/* User Avatar + Dropdown */}
                <div className={`user-menu ${isMenuOpen ? 'open' : ''}`} ref={dropdownRef}>
                    <button 
                        class="user-avatar-btn" 
                        id="userAvatarBtn" 
                        aria-label="Account menu" 
                        aria-expanded={isMenuOpen}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <span class="user-avatar-initials" id="userAvatarInitials">{getUserInitials()}</span>
                    </button>
                    <div class="user-dropdown" id="userDropdown" role="menu">
                        <div class="user-dropdown-header">
                            <div class="user-dropdown-avatar" id="userDropdownAvatar">{getUserInitials()}</div>
                            <div class="user-dropdown-info">
                                <span class="user-dropdown-name" id="userDropdownName">{getUserDisplayName()}</span>
                                <span class="user-dropdown-email" id="userDropdownEmail">{session?.user?.email || 'Offline Session'}</span>
                            </div>
                        </div>
                        <div class="user-dropdown-divider"></div>
                        
                        {session?.user ? (
                            <button class="user-dropdown-item user-dropdown-signout" id="btnHeaderSignOut" onClick={handleSignOut}>
                                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                Sign Out
                            </button>
                        ) : (
                            <button class="user-dropdown-item user-dropdown-signin" id="btnHeaderSignIn" onClick={() => router.push('/login')}>
                                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                    <polyline points="10 17 15 12 10 7"></polyline>
                                    <line x1="15" y1="12" x2="3" y2="12"></line>
                                </svg>
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
