/* ==========================================================================
   INTERVAL 2.0 - CORE APP ENTRY POINT & ROUTER
   ========================================================================== */

import { state, loadStateFromLocal, saveStateToLocal, updateState } from './core/state.js';
import {
    initSupabase,
    getSupabase,
    fetchStateFromCloud,
    saveStateToCloud,
    updateCloudUI,
    updateUserMenu,
    showApp,
    showAuthGate,
    saveState,
    pushToCloud,
    pullFromCloud,
} from './core/supabase.js';
import { getLocalDateString } from './utils/date.js';
import { showToast } from './utils/toast.js';
import { renderDashboard, setActiveBucketFilter, createRevisionCard } from './components/revision.js';
import { renderStriverSheet, expandedSteps, expandedSubsteps } from './components/striver.js';
import { initScheduleSettings, exportDatabase, importDatabase, resetDatabase } from './components/settings.js';
import { saveHabitState, renderGymPresetStrip } from './components/habits.js';

const viewSections = document.querySelectorAll('.view-section');
const menuItems = document.querySelectorAll('.menu-item');
const viewTitleEl = document.getElementById('currentViewTitle');
const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function switchView(viewName) {
    viewSections.forEach(section => {
        if (section.id === `view-${viewName}`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    menuItems.forEach(item => {
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    const formattedTitle = viewName === 'striver' 
        ? 'Striver DSA Sheet' 
        : viewName.charAt(0).toUpperCase() + viewName.slice(1);
    
    if (viewTitleEl) viewTitleEl.textContent = formattedTitle;

    // Trigger page-specific re-renders
    if (viewName === 'dashboard') {
        renderDashboard();
    } else if (viewName === 'striver') {
        renderStriverSheet();
    } else if (viewName === 'settings') {
        initScheduleSettings();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Loads authentication state and cloud/local data.
 * Does NOT show the app or render — that is the caller's responsibility
 * AFTER all event listeners have been registered, to prevent a frozen UI.
 * Returns: 'authenticated' | 'bypass' | 'redirect'
 */
async function loadStateAsync() {
    initSupabase();
    const supabase = getSupabase();
    const isBypass = new URLSearchParams(window.location.search).has('bypass');

    if (supabase) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Update user menu now so the avatar shows immediately when app reveals.
                updateUserMenu(session.user);

                const cloudState = await fetchStateFromCloud();
                if (cloudState) {
                    updateState(cloudState);
                    saveStateToLocal();
                    console.log('[Auth] State loaded from cloud.');
                } else {
                    // First time — seed cloud with current local data.
                    loadStateFromLocal();
                    await saveStateToCloud();
                }

                updateCloudUI();
                return 'authenticated';
            }
        } catch (err) {
            console.error('[Auth] Cloud load failed:', err);
        }
    }

    // Not authenticated
    updateUserMenu(null);
    updateCloudUI();

    if (isBypass) {
        loadStateFromLocal();
        return 'bypass';
    }

    return 'redirect';
}

const quickAddModal = document.getElementById('modalQuickAdd');

export function openQuickAddModal(prefilledTitle = '') {
    const titleEl = document.getElementById('modalTopicTitle');
    const categoryEl = document.getElementById('modalTopicCategory');
    const notesEl = document.getElementById('modalTopicNotes');
    
    if (titleEl) titleEl.value = prefilledTitle;
    if (categoryEl) categoryEl.value = prefilledTitle ? 'DSA' : '';
    if (notesEl) notesEl.value = '';
    
    const easyRadio = document.querySelector('input[name="modalDifficulty"][value="low"]');
    if (easyRadio) easyRadio.checked = true;
    
    if (quickAddModal) quickAddModal.classList.add('active');
}

export function closeQuickAddModal() {
    if (quickAddModal) quickAddModal.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', async () => {
    initUserMenu();

    // Register state-sync listener BEFORE loadStateAsync so OAuth-redirect
    // SIGNED_IN events (which call syncFromCloud → dispatch interval-state-synced)
    // are never silently dropped if they fire during the await below.
    document.addEventListener('interval-state-synced', () => {
        renderDashboard();
    });

    // Load state — state is now ready but app is still hidden.
    // Do NOT show the app or render here; do it after listeners are registered
    // so there is zero window where the UI is visible but unresponsive.
    const authResult = await loadStateAsync();

    if (authResult === 'redirect') {
        window.location.href = 'landing.html';
        return; // stop all further setup
    }

    // ── Register ALL event listeners BEFORE revealing the app ────────────────

    // Current date format display
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStrEl = document.getElementById('currentDateString');
    if (dateStrEl) dateStrEl.textContent = new Date().toLocaleDateString('en-US', options);

    // Sidebar View Switcher Events
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const viewName = e.currentTarget.getAttribute('data-view');
            switchView(viewName);
        });
    });

    // Spaced Repetition Bucket filter clicks
    document.querySelectorAll('.bucket-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.bucket-tab').forEach(t => t.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            const bucket = target.getAttribute('data-bucket');
            setActiveBucketFilter(bucket);
            renderDashboard();
        });
    });

    // Add Topic Button clicks (triggers modal)
    const btnQuickAdd = document.getElementById('btnQuickAddCard');
    if (btnQuickAdd) {
        btnQuickAdd.addEventListener('click', () => {
            openQuickAddModal();
        });
    }

    const btnEmptyState = document.getElementById('btnEmptyStateGoStriver');
    if (btnEmptyState) {
        btnEmptyState.addEventListener('click', () => {
            switchView('striver');
        });
    }

    // Modal close controls
    const btnCancel1 = document.getElementById('btnCancelQuickAdd');
    const btnCancel2 = document.getElementById('btnCancelQuickAdd2');
    const btnSaveQuickAdd = document.getElementById('btnSaveQuickAdd');

    if (btnCancel1) btnCancel1.addEventListener('click', closeQuickAddModal);
    if (btnCancel2) btnCancel2.addEventListener('click', closeQuickAddModal);

    if (btnSaveQuickAdd) {
        btnSaveQuickAdd.addEventListener('click', () => {
            const titleEl = document.getElementById('modalTopicTitle');
            const categoryEl = document.getElementById('modalTopicCategory');
            const notesEl = document.getElementById('modalTopicNotes');
            const difficultyEl = document.querySelector('input[name="modalDifficulty"]:checked');

            const title = titleEl ? titleEl.value.trim() : '';
            const category = categoryEl ? categoryEl.value.trim() : '';
            const notes = notesEl ? notesEl.value.trim() : '';
            const difficulty = difficultyEl ? difficultyEl.value : 'low';

            if (!title) {
                showToast('Please enter a card title.', 'danger');
                return;
            }

            createRevisionCard(title, category, notes, difficulty);
            closeQuickAddModal();
            renderDashboard();
        });
    }

    // Expandable Habit Accordion Toggle clicks
    const btnToggleGym = document.getElementById('btnToggleGym');
    if (btnToggleGym) {
        btnToggleGym.addEventListener('click', () => {
            const isExpanded = document.getElementById('cardGymHabit').classList.toggle('expanded');
            if (isExpanded) {
                renderGymPresetStrip();

                // Auto-apply logic
                const muscleSelect = document.getElementById('gymMuscle');
                const timeInput = document.getElementById('gymTime');
                if (muscleSelect && timeInput && muscleSelect.value === 'Push' && timeInput.value.trim() === '') {
                    const todayDayIndex = new Date().getDay();
                    const todayPreset = state.gymSchedule && state.gymSchedule[todayDayIndex];
                    if (todayPreset && (todayPreset.muscle || todayPreset.time)) {
                        if (todayPreset.muscle) muscleSelect.value = todayPreset.muscle;
                        if (todayPreset.time) timeInput.value = todayPreset.time;

                        setTimeout(() => {
                            const todayChip = document.querySelector(`.gym-preset-chip[data-day="${todayDayIndex}"]`);
                            if (todayChip) todayChip.classList.add('applied');
                        }, 50);
                        showToast("Auto-applied today's schedule preset!");
                    }
                }
            }
        });
    }

    const btnToggleComm = document.getElementById('btnToggleComm');
    if (btnToggleComm) {
        btnToggleComm.addEventListener('click', () => {
            document.getElementById('cardCommHabit').classList.toggle('expanded');
        });
    }

    // Save Gym Log Button
    const btnSaveGym = document.getElementById('btnSaveGym');
    if (btnSaveGym) {
        btnSaveGym.addEventListener('click', () => {
            const todayStr = getLocalDateString();
            const muscleSelect = document.getElementById('gymMuscle');
            const timeInput = document.getElementById('gymTime');
            const notesInput = document.getElementById('gymNotes');

            const muscle = muscleSelect ? muscleSelect.value : 'Push';
            const duration = timeInput ? timeInput.value.trim() : '';
            const notes = notesInput ? notesInput.value.trim() : '';

            const data = { muscle, duration, notes };
            saveHabitState(todayStr, 'gym', true, data);

            const cardGym = document.getElementById('cardGymHabit');
            if (cardGym) cardGym.classList.remove('expanded');
            showToast('Gym workout logged successfully!');
        });
    }

    // Save Communication Log Button
    const btnSaveComm = document.getElementById('btnSaveComm');
    if (btnSaveComm) {
        btnSaveComm.addEventListener('click', () => {
            const todayStr = getLocalDateString();
            const topicInput = document.getElementById('commTopic');
            const videoUrlInput = document.getElementById('commVideoUrl');

            const topic = topicInput ? topicInput.value.trim() : '';
            const videoUrl = videoUrlInput ? videoUrlInput.value.trim() : '';

            if (videoUrl && !videoUrl.startsWith('http')) {
                showToast('Please enter a valid URL (starting with http/https).', 'danger');
                return;
            }

            const data = { topic, videoUrl };
            saveHabitState(todayStr, 'comm', true, data);

            const cardComm = document.getElementById('cardCommHabit');
            if (cardComm) cardComm.classList.remove('expanded');
            showToast('Speaking practice logged successfully!');
        });
    }

    // Settings actions (Export)
    const btnExport = document.getElementById('btnExportData');
    if (btnExport) {
        btnExport.addEventListener('click', exportDatabase);
    }

    // Settings actions (Import)
    const fileSelector = document.getElementById('importFileSelector');
    if (fileSelector) {
        fileSelector.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importDatabase(e.target.files[0]);
            }
        });
    }

    // Settings Reset App State
    const btnClearDb = document.getElementById('btnClearDatabase');
    if (btnClearDb) {
        btnClearDb.addEventListener('click', resetDatabase);
    }

    // Save Gym Schedule Presets Button
    const btnSaveSchedule = document.getElementById('btnSaveSchedule');
    if (btnSaveSchedule) {
        btnSaveSchedule.addEventListener('click', async () => {
            const schedule = state.gymSchedule || {};
            for (let d = 0; d < 7; d++) {
                const key = DAY_KEYS[d];
                const muscleEl = document.getElementById(`scheduleMuscle${key}`);
                const timeEl = document.getElementById(`scheduleTime${key}`);

                if (muscleEl && timeEl) {
                    schedule[d] = {
                        muscle: muscleEl.value,
                        time: timeEl.value
                    };
                }
            }
            state.gymSchedule = schedule;
            saveState();

            const originalText = btnSaveSchedule.textContent;
            btnSaveSchedule.textContent = 'Saved ✓';
            btnSaveSchedule.disabled = true;

            setTimeout(() => {
                btnSaveSchedule.textContent = originalText;
                btnSaveSchedule.disabled = false;
            }, 1500);

            showToast('Weekly Gym Schedule saved successfully!');
        });
    }

    // Striver search input search event
    const searchInput = document.getElementById('striverSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            document.querySelectorAll('.striver-step-card').forEach(stepCard => {
                let stepHasVisibleProblem = false;

                // Filter and expand substeps individually if they contain matches
                stepCard.querySelectorAll('.striver-substep-wrap').forEach(subWrap => {
                    let subHasVisibleProblem = false;

                    subWrap.querySelectorAll('.striver-problem-row').forEach(row => {
                        const titleEl = row.querySelector('.striver-prob-title, .striver-prob-link');
                        const title = titleEl ? titleEl.textContent.toLowerCase() : '';
                        if (title.includes(query)) {
                            row.style.display = 'flex';
                            subHasVisibleProblem = true;
                            stepHasVisibleProblem = true;
                        } else {
                            row.style.display = 'none';
                        }
                    });

                    if (query && subHasVisibleProblem) {
                        subWrap.classList.add('expanded');
                    } else if (query && !subHasVisibleProblem) {
                        subWrap.classList.remove('expanded');
                    } else {
                        // Reset to default collapsed/expanded when search is cleared
                        const stepIdx = parseInt(subWrap.getAttribute('data-step-idx'), 10);
                        const subIdx = parseInt(subWrap.getAttribute('data-sub-idx'), 10);
                        const key = `${stepIdx}-${subIdx}`;
                        if (expandedSubsteps && expandedSubsteps.has(key)) {
                            subWrap.classList.add('expanded');
                        } else {
                            subWrap.classList.remove('expanded');
                        }
                    }
                });

                // Expand step card automatically during search if matches exist
                if (query && stepHasVisibleProblem) {
                    stepCard.classList.add('expanded');
                    stepCard.style.display = 'block';
                } else if (query && !stepHasVisibleProblem) {
                    stepCard.style.display = 'none';
                } else {
                    // Reset to default collapsed/expanded and visible when search is cleared
                    const stepIdx = parseInt(stepCard.id.replace('striver-step-', ''), 10);
                    if (expandedSteps && expandedSteps.has(stepIdx)) {
                        stepCard.classList.add('expanded');
                    } else {
                        stepCard.classList.remove('expanded');
                    }
                    stepCard.style.display = 'block';
                    stepCard.querySelectorAll('.striver-problem-row').forEach(row => row.style.display = 'flex');
                }
            });
        });
    }

    // Cloud Sync action buttons
    const btnPushCloud = document.getElementById('btnPushCloud');
    const btnPullCloud = document.getElementById('btnPullCloud');
    if (btnPushCloud) btnPushCloud.addEventListener('click', pushToCloud);
    if (btnPullCloud) btnPullCloud.addEventListener('click', pullFromCloud);

    // interval-state-synced registered above before loadStateAsync.

    document.addEventListener('interval-open-quick-add', (e) => {
        openQuickAddModal(e.detail.title);
    });

    // ── All listeners registered. NOW reveal the app and render. ─────────────
    // This guarantees zero gap between visibility and interactivity.
    if (authResult === 'authenticated' || authResult === 'bypass') {
        showApp();
    }

    // Single authoritative render — state loaded, listeners attached, app visible.
    switchView('dashboard');
});

// --- Header Account Menu ---
function closeUserDropdown() {
    const menu = document.getElementById('userMenu');
    const button = document.getElementById('userAvatarBtn');
    if (menu) menu.classList.remove('open');
    if (button) button.setAttribute('aria-expanded', 'false');
}

function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const button = document.getElementById('userAvatarBtn');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !button || !dropdown) return;

    button.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = menu.classList.toggle('open');
        button.setAttribute('aria-expanded', String(isOpen));
    });

    dropdown.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    document.addEventListener('click', closeUserDropdown);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeUserDropdown();
    });
}
