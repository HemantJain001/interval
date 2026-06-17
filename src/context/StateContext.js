'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getLocalDateString, getRelativeDateString } from '../utils/date';

const StateContext = createContext(null);
const STORAGE_KEY = 'interval_v2_state';
const BUCKET_INTERVALS = [1, 3, 7, 14, 30];

export function StateProvider({ children }) {
    const { data: session, status } = useSession();
    const [state, setState] = useState({
        revisionCards: [],
        habitsState: {},
        striverCompleted: {},
        gymSchedule: {}
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [toasts, setToasts] = useState([]);

    // ─── Toast System ────────────────────────────────────────────────────────
    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        
        // Auto remove toast after 4s
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // ─── Local Storage Operations ─────────────────────────────────────────────
    const saveToLocal = useCallback((newState) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
            // Sync legacy keys just in case
            localStorage.setItem('interval_revision_cards', JSON.stringify(newState.revisionCards));
            localStorage.setItem('interval_habits_state', JSON.stringify(newState.habitsState));
            localStorage.setItem('interval_striver_completed', JSON.stringify(newState.striverCompleted));
            localStorage.setItem('gymSchedule', JSON.stringify(newState.gymSchedule));
        } catch (e) {
            console.error('[State] localStorage save failed:', e);
        }
    }, []);

    const loadFromLocal = useCallback(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
            
            // Migrate from legacy keys
            return {
                revisionCards: JSON.parse(localStorage.getItem('interval_revision_cards') || '[]'),
                habitsState: JSON.parse(localStorage.getItem('interval_habits_state') || '{}'),
                striverCompleted: JSON.parse(localStorage.getItem('interval_striver_completed') || '{}'),
                gymSchedule: JSON.parse(localStorage.getItem('gymSchedule') || '{}')
            };
        } catch (e) {
            console.error('[State] localStorage load failed:', e);
            return null;
        }
    }, []);

    // ─── Server Sync Operations ───────────────────────────────────────────────
    const pushToCloud = useCallback(async (currentState) => {
        if (status !== 'authenticated') return false;
        
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: currentState })
            });
            return res.ok;
        } catch (err) {
            console.error('[State] Push to cloud failed:', err);
            return false;
        }
    }, [status]);

    const pullFromCloud = useCallback(async (silent = false) => {
        if (status !== 'authenticated') return null;
        if (!silent) setIsSyncing(true);
        
        try {
            const res = await fetch('/api/sync');
            if (res.ok) {
                const data = await res.json();
                return data.state;
            }
            return null;
        } catch (err) {
            console.error('[State] Pull from cloud failed:', err);
            return null;
        } finally {
            if (!silent) setIsSyncing(false);
        }
    }, [status]);

    const _mergeCardArrays = (primary, secondary) => {
        const map = new Map();
        // Load secondary first, primary (cloud) overwrites on key conflict
        [...(secondary || []), ...(primary || [])].forEach(card => {
            if (card && card.id) map.set(card.id, card);
        });
        return Array.from(map.values());
    };

    const syncState = useCallback(async (localState, silent = false) => {
        if (status !== 'authenticated') return;
        
        const cloudState = await pullFromCloud(silent);
        if (!cloudState) {
            // First time user on cloud: seed cloud with local data
            await pushToCloud(localState);
            if (!silent) showToast('Cloud storage initialised with local data.', 'success');
            return;
        }

        // Cloud wins: merge revision cards, overwrite simple structures
        const merged = {
            revisionCards: _mergeCardArrays(cloudState.revisionCards, localState.revisionCards),
            habitsState:      { ...localState.habitsState,      ...(cloudState.habitsState      || {}) },
            striverCompleted: { ...localState.striverCompleted, ...(cloudState.striverCompleted || {}) },
            gymSchedule:      { ...localState.gymSchedule,      ...(cloudState.gymSchedule      || {}) }
        };

        setState(merged);
        saveToLocal(merged);
        await pushToCloud(merged); // Sync back merged result
        
        if (!silent) showToast('Cloud data synchronised successfully.', 'success');
    }, [status, pullFromCloud, pushToCloud, saveToLocal, showToast]);

    // ─── Initial Load and Auto Sync ───────────────────────────────────────────
    useEffect(() => {
        // Step 1: Load local state instantly
        const local = loadFromLocal();
        if (local) {
            setState({
                revisionCards: local.revisionCards || [],
                habitsState: local.habitsState || {},
                striverCompleted: local.striverCompleted || {},
                gymSchedule: local.gymSchedule || {}
            });
        }
        setIsLoading(false);
        
        // Step 2: Trigger async sync if authenticated
        if (status === 'authenticated' && local) {
            syncState(local, true);
        }
    }, [status, loadFromLocal, syncState]);

    // Save helper that updates React State, LocalStorage, and pushes to Cloud in background
    const updateAndSaveState = useCallback((updater) => {
        setState(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            
            // Ensure schema safety
            const sanitized = {
                revisionCards: Array.isArray(next.revisionCards) ? next.revisionCards : [],
                habitsState: next.habitsState && typeof next.habitsState === 'object' ? next.habitsState : {},
                striverCompleted: next.striverCompleted && typeof next.striverCompleted === 'object' ? next.striverCompleted : {},
                gymSchedule: next.gymSchedule && typeof next.gymSchedule === 'object' ? next.gymSchedule : {}
            };
            
            saveToLocal(sanitized);
            
            if (status === 'authenticated') {
                pushToCloud(sanitized).catch(err => 
                    console.error('[State] Background sync failed:', err)
                );
            }
            return sanitized;
        });
    }, [status, saveToLocal, pushToCloud]);

    // ─── Actions / Mutators ───────────────────────────────────────────────────
    
    // Spaced Repetition actions
    const createRevisionCard = useCallback((title, category, notes, initialDifficulty) => {
        const id = Date.now().toString();
        const todayStr = getLocalDateString();
        
        let initialInterval = 1;
        if (initialDifficulty === 'medium') initialInterval = 3;
        if (initialDifficulty === 'low') initialInterval = 7;

        const nextDate = getLocalDateString(new Date(Date.now() + initialInterval * 24 * 60 * 60 * 1000));

        const newCard = {
            id,
            title,
            category: category || 'General',
            notes: notes || '',
            difficulty: initialDifficulty,
            dateStudied: todayStr,
            nextReviewDate: nextDate,
            currentInterval: initialInterval,
            history: []
        };

        updateAndSaveState(prev => ({
            ...prev,
            revisionCards: [...prev.revisionCards, newCard]
        }));
        
        showToast(`"${title}" added to Spaced Repetition schedule!`);
    }, [updateAndSaveState, showToast]);

    const logCardReview = useCallback((cardId, response) => {
        updateAndSaveState(prev => {
            const cardIndex = prev.revisionCards.findIndex(c => c.id === cardId);
            if (cardIndex === -1) return prev;

            const cards = [...prev.revisionCards];
            const card = { ...cards[cardIndex] };
            const todayStr = getLocalDateString();

            let nextInterval = card.currentInterval;
            if (response === 'easy') {
                const currentIdx = BUCKET_INTERVALS.indexOf(card.currentInterval);
                if (currentIdx !== -1 && currentIdx < BUCKET_INTERVALS.length - 1) {
                    nextInterval = BUCKET_INTERVALS[currentIdx + 1];
                } else if (currentIdx === -1) {
                    nextInterval = 7;
                } else {
                    nextInterval = 30;
                }
                card.difficulty = 'low';
            } else if (response === 'medium') {
                card.difficulty = 'medium';
            } else if (response === 'hard') {
                nextInterval = 1;
                card.difficulty = 'high';
            }

            const nextDate = getLocalDateString(new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000));
            
            card.history = [
                ...(card.history || []),
                {
                    date: todayStr,
                    response,
                    previousInterval: card.currentInterval,
                    nextInterval
                }
            ];

            card.currentInterval = nextInterval;
            card.nextReviewDate = nextDate;
            cards[cardIndex] = card;

            showToast(`Card review logged: ${response.toUpperCase()}`);
            return { ...prev, revisionCards: cards };
        });
    }, [updateAndSaveState, showToast]);

    // Habits actions
    const saveHabitState = useCallback((dateStr, habitType, isChecked, data = null) => {
        updateAndSaveState(prev => {
            const habits = { ...prev.habitsState };
            if (!habits[dateStr]) {
                habits[dateStr] = {
                    gym: false,
                    gymData: { muscle: 'Push', duration: '', notes: '' },
                    comm: false,
                    commData: { topic: '', videoUrl: '' }
                };
            }
            
            habits[dateStr] = {
                ...habits[dateStr],
                [habitType]: isChecked
            };

            if (data) {
                habits[dateStr][`${habitType}Data`] = data;
            }

            return { ...prev, habitsState: habits };
        });
    }, [updateAndSaveState]);

    // Striver DSA Sheet actions
    const toggleStriverProblem = useCallback((title) => {
        let isNowCompleted = false;
        updateAndSaveState(prev => {
            const completed = { ...prev.striverCompleted };
            if (completed[title]) {
                delete completed[title];
                isNowCompleted = false;
            } else {
                completed[title] = true;
                isNowCompleted = true;
            }
            return { ...prev, striverCompleted: completed };
        });
        showToast(isNowCompleted ? `Completed problem: "${title}"!` : `Unchecked: "${title}"`, isNowCompleted ? 'success' : 'warning');
    }, [updateAndSaveState, showToast]);

    // Gym schedule presets
    const saveGymSchedule = useCallback((schedule) => {
        updateAndSaveState(prev => ({
            ...prev,
            gymSchedule: schedule
        }));
        showToast('Weekly Gym Schedule saved successfully!');
    }, [updateAndSaveState, showToast]);

    // Reset database
    const resetDatabase = useCallback(() => {
        updateAndSaveState({
            revisionCards: [],
            habitsState: {},
            striverCompleted: {},
            gymSchedule: {}
        });
        showToast('App state reset completed.', 'warning');
    }, [updateAndSaveState, showToast]);

    // Import/Export database
    const importDatabase = useCallback((parsedState) => {
        if (parsedState.revisionCards && parsedState.habitsState && parsedState.striverCompleted) {
            updateAndSaveState(parsedState);
            showToast('Database imported successfully!');
            return true;
        } else {
            showToast('Invalid database schema.', 'danger');
            return false;
        }
    }, [updateAndSaveState, showToast]);

    // Manual cloud push/pull triggers
    const triggerManualPush = useCallback(async () => {
        setIsSyncing(true);
        const success = await pushToCloud(state);
        setIsSyncing(false);
        if (success) {
            showToast('Data uploaded to cloud successfully!', 'success');
        } else {
            showToast('Cloud upload failed. Check environment configuration.', 'danger');
        }
    }, [state, pushToCloud, showToast]);

    const triggerManualPull = useCallback(async () => {
        setIsSyncing(true);
        const cloudState = await pullFromCloud(false);
        setIsSyncing(false);
        if (cloudState) {
            updateAndSaveState(cloudState);
            showToast('Cloud data synchronised successfully.', 'success');
        } else {
            showToast('Cloud pull failed.', 'danger');
        }
    }, [pullFromCloud, updateAndSaveState, showToast]);

    return (
        <StateContext.Provider value={{
            state,
            isLoading,
            isSyncing,
            toasts,
            showToast,
            removeToast,
            createRevisionCard,
            logCardReview,
            saveHabitState,
            toggleStriverProblem,
            saveGymSchedule,
            resetDatabase,
            importDatabase,
            pushToCloud: triggerManualPush,
            pullFromCloud: triggerManualPull,
            syncState: () => syncState(state, false)
        }}>
            {children}
        </StateContext.Provider>
    );
}

export function useAppState() {
    const context = useContext(StateContext);
    if (!context) {
        throw new Error('useAppState must be used within a StateProvider');
    }
    return context;
}
