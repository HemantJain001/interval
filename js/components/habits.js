/* ==========================================================================
   INTERVAL 2.0 - HABITS LOGGING & PRESET CHIPS COMPONENT
   ========================================================================== */

import { state } from '../core/state.js';
import { saveState } from '../core/supabase.js';
import { showToast } from '../utils/toast.js';
import { renderDashboard } from './revision.js';

export function saveHabitState(dateStr, habitType, isChecked, data = null) {
    if (!state.habitsState[dateStr]) {
        state.habitsState[dateStr] = {
            gym: false,
            gymData: { muscle: 'Push', duration: '', notes: '' },
            comm: false,
            commData: { topic: '', videoUrl: '' }
        };
    }
    
    state.habitsState[dateStr][habitType] = isChecked;
    if (data) {
        state.habitsState[dateStr][`${habitType}Data`] = data;
    }
    
    saveState();
    renderDashboard();
}

export function renderGymPresetStrip() {
    const strip = document.getElementById('gymPresetStrip');
    const hint = document.getElementById('gymPresetHint');
    if (!strip) return;

    strip.innerHTML = '';
    const schedule = state.gymSchedule || {};
    const todayDayIndex = new Date().getDay();

    // Check if there is at least one preset configured
    let hasAnyPreset = false;
    for (let d = 0; d < 7; d++) {
        if (schedule[d] && (schedule[d].muscle || schedule[d].time)) {
            hasAnyPreset = true;
            break;
        }
    }

    if (!hasAnyPreset) {
        if (hint) hint.style.display = 'block';
    } else {
        if (hint) hint.style.display = 'none';
    }

    // Days mapping: Mon (1) to Sun (0)
    // To align Mon, Tue, Wed, Thu, Fri, Sat, Sun sequentially:
    const renderOrder = [1, 2, 3, 4, 5, 6, 0];
    const abbreviations = {
        1: 'M',
        2: 'T',
        3: 'W',
        4: 'Th',
        5: 'F',
        6: 'Sa',
        0: 'Su'
    };
    const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    renderOrder.forEach(dayIndex => {
        const preset = schedule[dayIndex];
        const isToday = dayIndex === todayDayIndex;
        const isConfigured = preset && (preset.muscle || preset.time);

        const chip = document.createElement('div');
        chip.className = 'gym-preset-chip';
        chip.setAttribute('data-day', dayIndex);

        if (isToday) {
            chip.classList.add('today');
        }

        if (isConfigured) {
            chip.classList.add('configured');
        } else {
            chip.classList.add('unset');
        }

        const daySpan = document.createElement('span');
        daySpan.className = 'gym-preset-day';
        daySpan.textContent = abbreviations[dayIndex];
        chip.appendChild(daySpan);

        const focusSpan = document.createElement('span');
        focusSpan.className = 'gym-preset-focus';
        
        if (isConfigured && preset.muscle) {
            focusSpan.textContent = preset.muscle;
            focusSpan.title = preset.muscle;
        } else if (isConfigured && preset.time) {
            focusSpan.textContent = preset.time;
        } else {
            focusSpan.textContent = '—';
        }
        chip.appendChild(focusSpan);

        // Click handler
        chip.addEventListener('click', () => {
            // Apply preset values
            const muscleSelect = document.getElementById('gymMuscle');
            const timeInput = document.getElementById('gymTime');

            if (preset && (preset.muscle || preset.time)) {
                if (preset.muscle) {
                    muscleSelect.value = preset.muscle;
                } else {
                    muscleSelect.value = 'Push';
                }
                
                if (preset.time) {
                    timeInput.value = preset.time;
                } else {
                    timeInput.value = '';
                }
                showToast(`Applied preset for ${WEEKDAYS[dayIndex]}`);
            } else {
                // Clear inputs if unset preset is tapped
                muscleSelect.value = 'Push';
                timeInput.value = '';
                showToast(`Cleared gym tracker fields`);
            }

            // Remove applied class from all chips
            strip.querySelectorAll('.gym-preset-chip').forEach(c => c.classList.remove('applied'));
            // Add applied class to this chip
            chip.classList.add('applied');
        });

        strip.appendChild(chip);
    });
}
