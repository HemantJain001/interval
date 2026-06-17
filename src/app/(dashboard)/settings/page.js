'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useAppState } from '@/context/StateContext';

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const {
        state,
        saveGymSchedule,
        resetDatabase,
        importDatabase,
        pushToCloud,
        pullFromCloud,
        isSyncing,
        showToast
    } = useAppState();

    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const [scheduleState, setScheduleState] = useState({});

    // Highlight today's row index
    const todayDayIndex = new Date().getDay();

    // Populate local state on mount or state change
    useEffect(() => {
        const schedule = state.gymSchedule || {};
        const initial = {};
        for (let d = 0; d < 7; d++) {
            initial[d] = {
                muscle: schedule[d]?.muscle || '',
                time: schedule[d]?.time || ''
            };
        }
        setScheduleState(initial);
    }, [state.gymSchedule]);

    // ─── Gym Schedule Presets handlers ───────────────────────────────────────
    const handleScheduleChange = (dayIndex, field, value) => {
        setScheduleState(prev => ({
            ...prev,
            [dayIndex]: {
                ...prev[dayIndex],
                [field]: value
            }
        }));
    };

    const handleSaveSchedule = async () => {
        setIsSavingSchedule(true);
        saveGymSchedule(scheduleState);
        setTimeout(() => {
            setIsSavingSchedule(false);
        }, 1000);
    };

    // ─── Export Database ──────────────────────────────────────────────────────
    const handleExport = () => {
        try {
            const dataStr = JSON.stringify(state, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', 'interval_backup_state.json');
            link.click();
            showToast('Database exported successfully!', 'success');
        } catch (e) {
            showToast('Failed to export database.', 'danger');
        }
    };

    // ─── Import Database ──────────────────────────────────────────────────────
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileReader = new FileReader();
        fileReader.onload = function(event) {
            try {
                const parsed = JSON.parse(event.target.result);
                const success = importDatabase(parsed);
                if (success) {
                    showToast('Database imported successfully!', 'success');
                }
            } catch (err) {
                showToast('Failed to parse database file.', 'danger');
            }
        };
        fileReader.readAsText(file);
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            resetDatabase();
        }
    };

    return (
        <section className="view-section active" id="view-settings">
            <div className="settings-layout">

                {/* Cloud Sync Card */}
                <div className="card settings-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <h2 className="settings-title">Cloud Storage (Supabase)</h2>
                        <span className={`cloud-status-badge ${status === 'authenticated' ? 'cloud-status-online' : 'cloud-status-offline'}`}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor', display: 'inline-block', marginRight: '6px' }}></span>
                            <span>{isSyncing ? 'Syncing...' : status === 'authenticated' ? 'Connected' : 'Not Signed In'}</span>
                        </span>
                    </div>
                    <p className="settings-desc">
                        Sign in with Google to sync your revision schedule, habits, and Striver progress across devices. All data is stored securely in the cloud.
                    </p>

                    {/* Auth Panel: shown when NOT signed in */}
                    {status !== 'authenticated' && (
                        <div id="cloudAuthPanel" style={{ padding: '16px 0', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
                            <button className="btn-google" onClick={() => signIn('google')}>
                                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                </svg>
                                <span>Sign In with Google</span>
                            </button>
                        </div>
                    )}

                    {/* Ops Panel: shown when signed in */}
                    {status === 'authenticated' && (
                        <div id="cloudOpsPanel" style={{ padding: '12px 0' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <h3 className="setting-item-title">Connected Account</h3>
                                <p className="setting-item-desc" id="cloudUserEmail" style={{ color: 'var(--success, #10b981)', fontWeight: 500 }}>
                                    {session.user?.email}
                                </p>
                                <p className="setting-item-desc" style={{ marginTop: '4px' }}>
                                    ✓ Cloud sync is active. Every action is auto-saved to Supabase.
                                </p>
                            </div>
                            <div className="settings-actions" style={{ flexWrap: 'wrap', gap: '8px', display: 'flex' }}>
                                <button className="btn btn-secondary" onClick={pushToCloud} disabled={isSyncing}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" style={{ marginRight: '6px' }}><polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path></svg>
                                    Push to Cloud
                                </button>
                                <button className="btn btn-secondary" onClick={pullFromCloud} disabled={isSyncing}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" style={{ marginRight: '6px' }}><polyline points="8 17 12 21 16 17"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path></svg>
                                    Pull from Cloud
                                </button>
                                <button className="btn btn-danger" onClick={() => signOut({ callbackUrl: '/login' })}>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Import / Export Card */}
                <div className="card settings-card">
                    <h2 className="settings-title">Storage &amp; Backup</h2>
                    <p className="settings-desc">Keep your spaced repetition schedule and habit history safe by importing/exporting or utilizing sync features.</p>
                    
                    <div className="settings-row">
                        <div className="settings-info">
                            <h3 className="setting-item-title">Import / Export Database</h3>
                            <p className="setting-item-desc">Manually backup your data as a JSON file or restore from a previous export.</p>
                        </div>
                        <div className="settings-actions">
                            <button className="btn btn-secondary" onClick={handleExport}>Export Database</button>
                            <label className="btn btn-secondary file-upload-label" style={{ display: 'inline-block', cursor: 'pointer' }}>
                                Import Database
                                <input type="file" id="importFileSelector" style={{ display: 'none' }} accept=".json" onChange={handleImport} />
                            </label>
                        </div>
                    </div>

                    <div className="settings-row">
                        <div className="settings-info">
                            <h3 className="setting-item-title">Clear All Local Data</h3>
                            <p className="setting-item-desc">Resets all study records, Streaks, and daily habit logs to start fresh.</p>
                        </div>
                        <div className="settings-actions">
                            <button className="btn btn-danger" onClick={handleReset}>Reset App State</button>
                        </div>
                    </div>
                </div>

                {/* Weekly Gym Schedule Presets Card */}
                <div className="card settings-card">
                    <h2 className="settings-title">Weekly Gym Schedule</h2>
                    <p className="settings-desc">Preset your daily muscle groups and workout times. When you open the Gym Tracker, today's preset will automatically fill in if current fields are empty.</p>
                    
                    <div className="schedule-table">
                        {[1, 2, 3, 4, 5, 6, 0].map(dayIndex => {
                            const key = DAY_KEYS[dayIndex];
                            const dayName = WEEKDAYS[dayIndex];
                            const isToday = dayIndex === todayDayIndex;
                            const dayPreset = scheduleState[dayIndex] || { muscle: '', time: '' };

                            return (
                                <div 
                                    key={dayIndex} 
                                    className={`schedule-row ${isToday ? 'today-row' : ''}`}
                                    id={`scheduleRow${key}`}
                                >
                                    <span className="schedule-day-label">{dayName}</span>
                                    <select 
                                        className="form-control schedule-muscle" 
                                        id={`scheduleMuscle${key}`}
                                        value={dayPreset.muscle}
                                        onChange={(e) => handleScheduleChange(dayIndex, 'muscle', e.target.value)}
                                    >
                                        <option value="">-- No Preset --</option>
                                        <option value="Push">Push (Chest/Shoulders/Triceps)</option>
                                        <option value="Pull">Pull (Back/Biceps)</option>
                                        <option value="Legs">Legs / Core</option>
                                        <option value="Cardio">Cardio / Endurance</option>
                                        <option value="Rest">Rest / Recovery</option>
                                    </select>
                                    <input 
                                        type="time" 
                                        className="form-control schedule-time" 
                                        id={`scheduleTime${key}`}
                                        value={dayPreset.time}
                                        onChange={(e) => handleScheduleChange(dayIndex, 'time', e.target.value)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    
                    <div style={{ marginTop: '20px' }}>
                        <button className="btn btn-primary" onClick={handleSaveSchedule} disabled={isSavingSchedule}>
                            {isSavingSchedule ? 'Saved ✓' : 'Save Schedule'}
                        </button>
                    </div>
                </div>

                {/* System Configuration */}
                <div className="card settings-card mt-6">
                    <h2 className="settings-title">System Status</h2>
                    <div className="system-status-list">
                        <div className="status-item">
                            <span>Active Workspace</span>
                            <span className="status-value font-mono">e:\Coding\Interval_2.0</span>
                        </div>
                        <div className="status-item">
                            <span>Storage Backend</span>
                            <span className="status-value status-badge badge-green">Supabase Cloud</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
