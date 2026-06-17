/* ==========================================================================
   INTERVAL 2.0 - LANDING PAGE AUTHENTICATION BOOTSTRAPPER
   ========================================================================== */

import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const envKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

const url = envUrl || localStorage.getItem('supabase_url') || '';
const key = envKey || localStorage.getItem('supabase_publishable_key') || '';

let supabase = null;
if (url && key) {
    supabase = createClient(url, key);
}

document.addEventListener('DOMContentLoaded', async () => {
    let session = null;

    if (supabase) {
        try {
            const { data } = await supabase.auth.getSession();
            session = data?.session;
        } catch (err) {
            console.error('[Interval] Failed to fetch session:', err);
        }
    }

    const navCta = document.getElementById('navCta');
    const heroPrimaryBtn = document.getElementById('heroPrimaryBtn');
    const ctaPrimaryBtn = document.getElementById('ctaPrimaryBtn');

    // If already signed in, redirect straight to the dashboard
    if (session?.user) {
        window.location.href = 'index.html';
        return;
    }

    // Set up Auth state change to catch redirects and auto-forward to dashboard
    if (supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                window.location.href = 'index.html';
            }
        });
    }

    const handleAuthAction = async (e) => {
        if (e) e.preventDefault();

        if (!supabase) {
            alert('Supabase is not configured.');
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { 
                    redirectTo: window.location.origin + '/index.html'
                }
            });
            if (error) throw error;
        } catch (err) {
            alert(`Sign-in error: ${err.message}`);
        }
    };

    const scrollToLogin = (e) => {
        e.preventDefault();
        const loginCard = document.getElementById('loginCard');
        if (loginCard) {
            // Smooth scroll to card
            loginCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add visual highlight effect on card border
            const originalBorder = loginCard.style.borderColor;
            loginCard.style.borderColor = 'var(--indigo)';
            loginCard.style.boxShadow = '0 0 16px var(--indigo-glow)';
            
            setTimeout(() => {
                loginCard.style.borderColor = originalBorder;
                loginCard.style.boxShadow = '';
            }, 1200);

            // Shift keyboard focus to the Google login button inside the card
            const googleBtn = document.getElementById('googleLoginBtn');
            if (googleBtn) {
                setTimeout(() => googleBtn.focus(), 600);
            }
        }
    };

    // Bind event listeners to CTAs
    if (navCta) {
        navCta.addEventListener('click', scrollToLogin);
        navCta.innerHTML = 'Sign In';
    }

    if (heroPrimaryBtn) {
        heroPrimaryBtn.style.display = 'inline-flex';
        heroPrimaryBtn.style.alignItems = 'center';
        heroPrimaryBtn.style.gap = '8px';
        heroPrimaryBtn.addEventListener('click', scrollToLogin);
        heroPrimaryBtn.innerHTML = `
            Get Started
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" aria-hidden="true" style="flex-shrink:0;">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="13 6 19 12 13 18"></polyline>
            </svg>
        `;
    }

    // Bind login action directly to the Google login button inside the card
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleAuthAction);
    }

    if (ctaPrimaryBtn) {
        ctaPrimaryBtn.addEventListener('click', handleAuthAction);
        ctaPrimaryBtn.innerHTML = 'Sign In with Google';
    }
});
