/* ==========================================================================
   INTERVAL 2.0 - CORE GLOBAL STATE STORE
   ========================================================================== */

export const STORAGE_KEY = 'interval_v2_state';

export let state = {
    revisionCards: [],
    habitsState: {},
    striverCompleted: {},
    gymSchedule: {}
};

export function sanitizeState() {
    if (!Array.isArray(state.revisionCards)) state.revisionCards = [];
    if (!state.habitsState || typeof state.habitsState !== 'object') state.habitsState = {};
    if (!state.striverCompleted || typeof state.striverCompleted !== 'object') state.striverCompleted = {};
    if (!state.gymSchedule || typeof state.gymSchedule !== 'object') state.gymSchedule = {};
}

export function getHabitStateForDate(dateStr) {
    return state.habitsState[dateStr] || {
        gym: false,
        gymData: { muscle: 'Push', duration: '', notes: '' },
        comm: false,
        commData: { topic: '', videoUrl: '' }
    };
}

export function updateState(newState) {
    if (newState) {
        state.revisionCards = newState.revisionCards || [];
        state.habitsState = newState.habitsState || {};
        state.striverCompleted = newState.striverCompleted || {};
        state.gymSchedule = newState.gymSchedule || {};
    }
    sanitizeState();
}

export function saveStateToLocal() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        // Legacy keys — keep in sync for any tools that read them directly
        localStorage.setItem('interval_revision_cards', JSON.stringify(state.revisionCards));
        localStorage.setItem('interval_habits_state', JSON.stringify(state.habitsState));
        localStorage.setItem('interval_striver_completed', JSON.stringify(state.striverCompleted));
        localStorage.setItem('gymSchedule', JSON.stringify(state.gymSchedule));
    } catch (e) {
        console.error('[Interval] localStorage save failed:', e);
    }
}

export function loadStateFromLocal() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        let parsed = null;
        if (stored) {
            parsed = JSON.parse(stored);
        } else {
            // Migrate from old individual keys
            parsed = {
                revisionCards: JSON.parse(localStorage.getItem('interval_revision_cards') || '[]'),
                habitsState: JSON.parse(localStorage.getItem('interval_habits_state') || '{}'),
                striverCompleted: JSON.parse(localStorage.getItem('interval_striver_completed') || '{}'),
                gymSchedule: JSON.parse(localStorage.getItem('gymSchedule') || '{}')
            };
        }
        updateState(parsed);
    } catch (e) {
        console.error('[Interval] localStorage load failed:', e);
    }
}
