/* ==========================================================================
   INTERVAL 2.0 - SUPABASE AUTH & STORAGE PROVIDER
   ========================================================================== */

import { createClient } from '@supabase/supabase-js';
import { showToast } from '../utils/toast.js';
import { state, saveStateToLocal, updateState } from './state.js';

const DB_TABLE_NAME = 'interval_tracker';
export let supabase = null;

export function initSupabase() {
    const envUrl = import.meta.env?.VITE_SUPABASE_URL || '';
    const envKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

    const url = envUrl || localStorage.getItem('supabase_url') || '';
    const key = envKey || localStorage.getItem('supabase_publishable_key') || '';

    if (url && key) {
        try {
            supabase = createClient(url, key);
            console.log('[Interval] Supabase client initialized.');

            supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('[Interval] Auth event:', event);
                if (session) {
                    showApp();
                    await syncFromCloud(true);
                    document.dispatchEvent(new CustomEvent('interval-state-synced'));
                    updateUserMenu(session.user);
                    updateCloudUI();
                } else {
                    updateUserMenu(null);
                    if (!new URLSearchParams(window.location.search).has('bypass')) {
                        window.location.href = 'landing.html';
                    }
                    updateCloudUI();
                }
            });
        } catch (err) {
            console.error('[Interval] Failed to initialize Supabase:', err);
            supabase = null;
        }
    } else {
        supabase = null;
    }
}

export async function signInWithGoogle() {
    if (!supabase) { showToast('Supabase is not configured.', 'danger'); return; }
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) throw error;
    } catch (err) {
        showToast(`Sign-in error: ${err.message}`, 'danger');
    }
}
window.signInWithGoogle = signInWithGoogle;

export async function signOutUser() {
    if (!supabase) return;
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    } catch (err) {
        showToast('Sign-out failed.', 'danger');
    }
}
window.signOutUser = signOutUser;

export async function saveStateToCloud() {
    if (!supabase) return false;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return false;

        const { error } = await supabase
            .from(DB_TABLE_NAME)
            .upsert({ id: session.user.id, state, updated_at: new Date().toISOString() });

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('[Interval] Cloud save failed:', err);
        return false;
    }
}

export async function fetchStateFromCloud() {
    if (!supabase) return null;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        const { data, error } = await supabase
            .from(DB_TABLE_NAME)
            .select('state')
            .eq('id', session.user.id)
            .maybeSingle();

        if (error) throw error;
        return data?.state || null;
    } catch (err) {
        console.error('[Interval] Cloud fetch failed:', err);
        return null;
    }
}

export async function syncFromCloud(silent = false) {
    if (!supabase) return;
    try {
        const cloudState = await fetchStateFromCloud();
        if (!cloudState) {
            await saveStateToCloud();
            if (!silent) showToast('Cloud storage initialized with local data.', 'success');
            return;
        }
        
        const merged = {
            revisionCards: mergeCardArrays(state.revisionCards, cloudState.revisionCards || []),
            habitsState: Object.assign({}, state.habitsState, cloudState.habitsState || {}),
            striverCompleted: Object.assign({}, state.striverCompleted, cloudState.striverCompleted || {}),
            gymSchedule: Object.assign({}, state.gymSchedule, cloudState.gymSchedule || {})
        };
        updateState(merged);
        saveStateToLocal();
        await saveStateToCloud();
        document.dispatchEvent(new CustomEvent('interval-state-synced'));
        if (!silent) showToast('Cloud data synchronized successfully.', 'success');
    } catch (err) {
        console.error('[Interval] Sync from cloud failed:', err);
        if (!silent) showToast('Cloud sync failed.', 'danger');
    }
}

function mergeCardArrays(local, cloud) {
    const map = new Map();
    [...cloud, ...local].forEach(card => map.set(card.id, card));
    return Array.from(map.values());
}

export async function pushToCloud() {
    const success = await saveStateToCloud();
    if (success) showToast('Data uploaded to cloud successfully!', 'success');
    else showToast('Cloud upload failed. Check Supabase table/policies.', 'danger');
}
window.pushToCloud = pushToCloud;

export async function pullFromCloud() {
    await syncFromCloud(false);
}
window.pullFromCloud = pullFromCloud;

export function showApp() {
    const gate = document.getElementById('authGate');
    const app = document.getElementById('appContainer');
    if (gate) gate.style.display = 'none';
    if (app) app.style.display = 'flex';
}

export function showAuthGate(loading = false) {
    const gate = document.getElementById('authGate');
    const app = document.getElementById('appContainer');
    const actionsEl = document.getElementById('authGateActions');
    const loadingEl = document.getElementById('authGateLoading');

    if (gate) gate.style.display = 'flex';
    if (app) app.style.display = 'none';

    if (actionsEl) actionsEl.style.display = loading ? 'none' : 'block';
    if (loadingEl) loadingEl.style.display = loading ? 'flex' : 'none';
}

function getUserDisplayName(user) {
    if (!user) return 'Not signed in';
    const metadata = user.user_metadata || {};
    return metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Signed in user';
}

function getUserInitials(user) {
    const displayName = getUserDisplayName(user);
    const parts = displayName
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return '?';
}

export function updateUserMenu(user) {
    const initials = getUserInitials(user);
    const displayName = getUserDisplayName(user);
    const email = user?.email || 'Not signed in';

    const avatarInitialsEl = document.getElementById('userAvatarInitials');
    const dropdownAvatarEl = document.getElementById('userDropdownAvatar');
    const dropdownNameEl = document.getElementById('userDropdownName');
    const dropdownEmailEl = document.getElementById('userDropdownEmail');
    const btnHeaderSignOut = document.getElementById('btnHeaderSignOut');

    if (avatarInitialsEl) avatarInitialsEl.textContent = initials;
    if (dropdownAvatarEl) dropdownAvatarEl.textContent = initials;
    if (dropdownNameEl) dropdownNameEl.textContent = displayName;
    if (dropdownEmailEl) dropdownEmailEl.textContent = email;

    if (btnHeaderSignOut) {
        if (user) {
            btnHeaderSignOut.innerHTML = `
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sign Out
            `;
            btnHeaderSignOut.onclick = () => window.signOutUser();
            btnHeaderSignOut.className = 'user-dropdown-item user-dropdown-signout';
        } else {
            btnHeaderSignOut.innerHTML = `
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Sign In with Google
            `;
            btnHeaderSignOut.onclick = () => window.signInWithGoogle();
            btnHeaderSignOut.className = 'user-dropdown-item user-dropdown-signin';
        }
    }
}

export function updateCloudUI() {
    const badge = document.getElementById('cloudStatusBadge');
    const text = document.getElementById('cloudStatusText');
    const authPanel = document.getElementById('cloudAuthPanel');
    const opsPanel = document.getElementById('cloudOpsPanel');
    const userEmailEl = document.getElementById('cloudUserEmail');
    if (!badge) return;

    if (!supabase) {
        badge.className = 'cloud-status-badge cloud-status-offline';
        text.textContent = 'Not Configured';
        if (authPanel) authPanel.style.display = 'none';
        if (opsPanel) opsPanel.style.display = 'none';
        return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
            badge.className = 'cloud-status-badge cloud-status-online';
            text.textContent = 'Connected';
            if (authPanel) authPanel.style.display = 'none';
            if (opsPanel) opsPanel.style.display = 'block';
            if (userEmailEl) userEmailEl.textContent = session.user.email;
            updateUserMenu(session.user);
        } else {
            badge.className = 'cloud-status-badge cloud-status-expired';
            text.textContent = 'Not Signed In';
            if (authPanel) authPanel.style.display = 'block';
            if (opsPanel) opsPanel.style.display = 'none';
            updateUserMenu(null);
        }
    }).catch(console.error);
}

export function saveState() {
    saveStateToLocal();
    if (supabase) {
        saveStateToCloud().catch(err => console.error('[Interval] Background cloud save failed:', err));
    }
}
