/* ==========================================================================
   INTERVAL 2.0 - SETTINGS VIEW COMPONENT
   ========================================================================== */

import { state, updateState } from '../core/state.js';
import { saveState } from '../core/supabase.js';
import { showToast } from '../utils/toast.js';
import { renderDashboard } from './revision.js';

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function initScheduleSettings() {
    const todayDayIndex = new Date().getDay();
    
    // Clear today-row highlight from all rows
    document.querySelectorAll('.schedule-row').forEach(row => {
        row.classList.remove('today-row');
    });

    // Highlight today's row in settings
    const todayRow = document.getElementById(`scheduleRow${DAY_KEYS[todayDayIndex]}`);
    if (todayRow) todayRow.classList.add('today-row');

    // Populate values
    const schedule = state.gymSchedule || {};
    for (let d = 0; d < 7; d++) {
        const key = DAY_KEYS[d];
        const muscleEl = document.getElementById(`scheduleMuscle${key}`);
        const timeEl = document.getElementById(`scheduleTime${key}`);
        
        if (muscleEl && timeEl) {
            const dayPreset = schedule[d] || { muscle: '', time: '' };
            muscleEl.value = dayPreset.muscle || '';
            timeEl.value = dayPreset.time || '';
        }
    }
}

export function exportDatabase() {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'interval_backup_state.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast('Database exported successfully!');
}

export function importDatabase(file) {
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
        try {
            const parsed = JSON.parse(event.target.result);
            if (parsed.revisionCards && parsed.habitsState && parsed.striverCompleted) {
                updateState(parsed);
                saveState();
                renderDashboard();
                showToast('Database imported successfully!');
            } else {
                showToast('Invalid database schema.', 'danger');
            }
        } catch (err) {
            showToast('Failed to parse database file.', 'danger');
        }
    };
    fileReader.readAsText(file);
}

export function resetDatabase() {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        updateState({
            revisionCards: [],
            habitsState: {},
            striverCompleted: {},
            gymSchedule: {}
        });
        saveState();
        renderDashboard();
        showToast('App state reset completed.', 'warning');
    }
}
