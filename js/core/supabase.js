/* ==========================================================================
   INTERVAL 2.0 - SUPABASE AUTH & STORAGE PROVIDER
   ========================================================================== */

import { createClient } from '@supabase/supabase-js';
import { showToast } from '../utils/toast.js';
import { state, saveStateToLocal, updateState } from './state.js';

const DB_TABLE_NAME = 'interval_tracker';

// Internal client instance — always access via getSupabase() from outside.
let _supabase = null;

/**
 * Safe accessor for the Supabase client.
 * Returns null if Supabase is not yet configured.
 */
export function getSupabase() {
    return _supabase;
}

// ─── Initialisation ───────────────────────────────────────────────────────────

export function initSupabase() {
    const envUrl = import.meta.env?.VITE_SUPABASE_URL || '';
    const envKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

    const url = envUrl || localStorage.getItem('supabase_url') || '';
    const key = envKey || localStorage.getItem('supabase_publishable_key') || '';

    if (url && key) {
        try {
            _supabase = createClient(url, key);
            console.log('[Auth] Supabase client initialised.');
            _registerAuthListener();
        } catch (err) {
            console.error('[Auth] Failed to initialise Supabase:', err);
            _supabase = null;
        }
    } else {
        _supabase = null;
        console.warn('[Auth] Supabase credentials not found — running offline.');
    }
}

// ─── Auth State Listener ──────────────────────────────────────────────────────

/**
 * Registers the global auth state change listener.
 *
 * Responsibilities:
 *  - INITIAL_SESSION  → skip (handled exclusively by loadStateAsync in main.js)
 *  - SIGNED_IN        → fires after OAuth redirect; show app, sync, render
 *  - TOKEN_REFRESHED  → silent, update UI only
 *  - SIGNED_OUT       → redirect to landing
 *  - All others       → ignored
 *
 * IMPORTANT: Does NOT dispatch 'interval-state-synced' itself.
 * syncFromCloud is responsible for that single dispatch.
 */
function _registerAuthListener() {
    _supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] Event:', event);

        // INITIAL_SESSION is handled by loadStateAsync() on every page load.
        // Reacting here would cause a duplicate sync that races with
        // DOMContentLoaded listeners, freezing the page after refresh.
        if (event === 'INITIAL_SESSION') return;

        if (event === 'SIGNED_IN' && session) {
            // This fires on OAuth redirect return.
            // main.js has already registered the interval-state-synced listener
            // before calling loadStateAsync, so the dispatch from syncFromCloud
            // will be caught correctly.
            showApp();
            updateUserMenu(session.user);
            updateCloudUI();
            await syncFromCloud(true);
            // NOTE: no extra dispatch here — syncFromCloud does it once internally.
            return;
        }

        if (event === 'TOKEN_REFRESHED' && session) {
            // Silently keep UI in sync.
            updateUserMenu(session.user);
            updateCloudUI();
            return;
        }

        if (event === 'SIGNED_OUT') {
            updateUserMenu(null);
            updateCloudUI();
            if (!new URLSearchParams(window.location.search).has('bypass')) {
                window.location.href = 'landing.html';
            }
        }
    });
}

// ─── Auth Actions ─────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
    if (!_supabase) { showToast('Supabase is not configured.', 'danger'); return; }
    try {
        const { error } = await _supabase.auth.signInWithOAuth({
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
    if (!_supabase) return;
    try {
        const { error } = await _supabase.auth.signOut();
        if (error) throw error;
        // onAuthStateChange(SIGNED_OUT) will handle the redirect.
    } catch (err) {
        showToast('Sign-out failed.', 'danger');
    }
}
window.signOutUser = signOutUser;

// ─── Cloud Storage ────────────────────────────────────────────────────────────

export async function saveStateToCloud() {
    if (!_supabase) return false;
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session?.user) return false;

        const { error } = await _supabase
            .from(DB_TABLE_NAME)
            .upsert({ id: session.user.id, state, updated_at: new Date().toISOString() });

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('[Auth] Cloud save failed:', err);
        return false;
    }
}

export async function fetchStateFromCloud() {
    if (!_supabase) return null;
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session?.user) return null;

        const { data, error } = await _supabase
            .from(DB_TABLE_NAME)
            .select('state')
            .eq('id', session.user.id)
            .maybeSingle();

        if (error) throw error;
        return data?.state || null;
    } catch (err) {
        console.error('[Auth] Cloud fetch failed:', err);
        return null;
    }
}

/**
 * Syncs cloud → local.
 *
 * Merge strategy: CLOUD WINS.
 * The cloud was written last (from a committed user action on any device),
 * so it is always treated as the source of truth. Local-only additions
 * (revision cards not in the cloud) are preserved by the card merge.
 *
 * Dispatches 'interval-state-synced' exactly once on success.
 */
export async function syncFromCloud(silent = false) {
    if (!_supabase) return;
    try {
        const cloudState = await fetchStateFromCloud();

        if (!cloudState) {
            // First time user — seed cloud with current local data.
            await saveStateToCloud();
            if (!silent) showToast('Cloud storage initialised with local data.', 'success');
            // No state changed, so no re-render needed.
            return;
        }

        // Cloud wins: merge revision cards (preserve local-only cards, cloud record
        // overrides local on conflict), cloud objects override local for everything else.
        const merged = {
            revisionCards: _mergeCardArrays(cloudState.revisionCards || [], state.revisionCards),
            habitsState:      { ...state.habitsState,      ...(cloudState.habitsState      || {}) },
            striverCompleted: { ...state.striverCompleted, ...(cloudState.striverCompleted || {}) },
            gymSchedule:      { ...state.gymSchedule,      ...(cloudState.gymSchedule      || {}) },
        };

        updateState(merged);
        saveStateToLocal();
        await saveStateToCloud(); // persist merged result back

        // Single, authoritative dispatch. Listeners in main.js re-render the UI.
        document.dispatchEvent(new CustomEvent('interval-state-synced'));

        if (!silent) showToast('Cloud data synchronised successfully.', 'success');
    } catch (err) {
        console.error('[Auth] Sync from cloud failed:', err);
        if (!silent) showToast('Cloud sync failed.', 'danger');
    }
}

/**
 * Merges two card arrays. `primary` wins on conflict (same id).
 * Cards only in `secondary` are appended.
 */
function _mergeCardArrays(primary, secondary) {
    const map = new Map();
    // Load secondary first so primary overwrites on conflict.
    [...secondary, ...primary].forEach(card => map.set(card.id, card));
    return Array.from(map.values());
}

// ─── Manual Cloud Actions (Settings page) ────────────────────────────────────

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

// ─── UI Visibility ────────────────────────────────────────────────────────────

export function showApp() {
    const gate = document.getElementById('authGate');
    const app  = document.getElementById('appContainer');
    if (gate) gate.style.display = 'none';
    if (app)  app.style.display  = 'flex';
}

export function showAuthGate(loading = false) {
    const gate      = document.getElementById('authGate');
    const app       = document.getElementById('appContainer');
    const actionsEl = document.getElementById('authGateActions');
    const loadingEl = document.getElementById('authGateLoading');

    if (gate) gate.style.display = 'flex';
    if (app)  app.style.display  = 'none';
    if (actionsEl) actionsEl.style.display = loading ? 'none' : 'block';
    if (loadingEl) loadingEl.style.display = loading ? 'flex'  : 'none';
}

// ─── User Menu ────────────────────────────────────────────────────────────────

function _getUserDisplayName(user) {
    if (!user) return 'Not signed in';
    const meta = user.user_metadata || {};
    return meta.full_name || meta.name || user.email?.split('@')[0] || 'Signed in user';
}

function _getUserInitials(user) {
    const name  = _getUserDisplayName(user);
    const parts = name.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return '?';
}

/**
 * Updates the header user avatar + dropdown contents.
 * Pass `null` for `user` to show the signed-out state.
 *
 * This is the single source of truth for user menu state.
 * updateCloudUI does NOT call this — callers are responsible.
 */
export function updateUserMenu(user) {
    const initials     = _getUserInitials(user);
    const displayName  = _getUserDisplayName(user);
    const email        = user?.email || 'Not signed in';

    const avatarInitialsEl = document.getElementById('userAvatarInitials');
    const dropdownAvatarEl = document.getElementById('userDropdownAvatar');
    const dropdownNameEl   = document.getElementById('userDropdownName');
    const dropdownEmailEl  = document.getElementById('userDropdownEmail');
    const btnSignOut       = document.getElementById('btnHeaderSignOut');

    if (avatarInitialsEl) avatarInitialsEl.textContent = initials;
    if (dropdownAvatarEl) dropdownAvatarEl.textContent = initials;
    if (dropdownNameEl)   dropdownNameEl.textContent   = displayName;
    if (dropdownEmailEl)  dropdownEmailEl.textContent  = email;

    if (btnSignOut) {
        if (user) {
            btnSignOut.innerHTML = `
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sign Out
            `;
            btnSignOut.onclick   = () => signOutUser();
            btnSignOut.className = 'user-dropdown-item user-dropdown-signout';
        } else {
            btnSignOut.innerHTML = `
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Sign In with Google
            `;
            btnSignOut.onclick   = () => signInWithGoogle();
            btnSignOut.className = 'user-dropdown-item user-dropdown-signin';
        }
    }
}

// ─── Cloud Status UI ──────────────────────────────────────────────────────────

/**
 * Updates the cloud status badge and panels in the Settings view.
 * Does NOT call updateUserMenu — that is the caller's responsibility.
 */
export function updateCloudUI() {
    const badge      = document.getElementById('cloudStatusBadge');
    const text       = document.getElementById('cloudStatusText');
    const authPanel  = document.getElementById('cloudAuthPanel');
    const opsPanel   = document.getElementById('cloudOpsPanel');
    const userEmailEl = document.getElementById('cloudUserEmail');

    if (!badge) return;

    if (!_supabase) {
        badge.className  = 'cloud-status-badge cloud-status-offline';
        if (text) text.textContent = 'Not Configured';
        if (authPanel) authPanel.style.display = 'none';
        if (opsPanel)  opsPanel.style.display  = 'none';
        return;
    }

    _supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
            badge.className = 'cloud-status-badge cloud-status-online';
            if (text)       text.textContent       = 'Connected';
            if (authPanel)  authPanel.style.display = 'none';
            if (opsPanel)   opsPanel.style.display  = 'block';
            if (userEmailEl) userEmailEl.textContent = session.user.email;
        } else {
            badge.className = 'cloud-status-badge cloud-status-expired';
            if (text)      text.textContent      = 'Not Signed In';
            if (authPanel) authPanel.style.display = 'block';
            if (opsPanel)  opsPanel.style.display  = 'none';
        }
    }).catch(err => console.error('[Auth] updateCloudUI failed:', err));
}

// ─── Unified Save ─────────────────────────────────────────────────────────────

/** Saves to localStorage immediately and queues a background cloud save. */
export function saveState() {
    saveStateToLocal();
    if (_supabase) {
        saveStateToCloud().catch(err =>
            console.error('[Auth] Background cloud save failed:', err)
        );
    }
}
