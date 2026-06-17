/* ==========================================================================
   INTERVAL 2.0 - STRIVER DSA SHEET ACCORDION COMPONENT
   ========================================================================== */

import { state } from '../core/state.js';
import { saveState } from '../core/supabase.js';
import { showToast } from '../utils/toast.js';
import { STRIVER_A2Z_DATA } from '../../striver_data.js';

export const expandedSteps = new Set();
export const expandedSubsteps = new Set();

export function renderStriverSheet() {
    const container = document.getElementById('striverAccordion');
    if (!container) return;
    container.innerHTML = '';

    let totalCompleted = 0;
    let totalQuestions = 0;

    STRIVER_A2Z_DATA.forEach((stepData, stepIdx) => {
        let stepCompletedCount = 0;
        let stepTotalCount = 0;

        // Count totals
        stepData.substeps.forEach(sub => {
            sub.problems.forEach(prob => {
                stepTotalCount++;
                totalQuestions++;
                if (state.striverCompleted && state.striverCompleted[prob.title]) {
                    stepCompletedCount++;
                    totalCompleted++;
                }
            });
        });

        const stepEl = document.createElement('div');
        stepEl.className = 'striver-step-card' + (expandedSteps.has(stepIdx) ? ' expanded' : '');
        stepEl.id = `striver-step-${stepIdx}`;

        let substepsHTML = '';
        stepData.substeps.forEach((sub, subIdx) => {
            let problemsHTML = '';
            sub.problems.forEach(prob => {
                const isCompleted = state.striverCompleted && state.striverCompleted[prob.title] ? 'completed' : '';
                
                // YouTube Link icon
                let videoBtn = '';
                if (prob.video) {
                    videoBtn = `
                        <a href="${prob.video}" target="_blank" class="striver-btn-video" title="Watch Video Tutorial">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                        </a>
                    `;
                }

                // External link markup
                let titleMarkup = `<span class="striver-prob-title">${prob.title}</span>`;
                if (prob.link) {
                    titleMarkup = `<a href="${prob.link}" target="_blank" class="striver-prob-link">${prob.title}</a>`;
                }

                problemsHTML += `
                    <div class="striver-problem-row ${isCompleted}">
                        <div class="striver-prob-left">
                            <button class="chk-striver-problem" data-title="${prob.title}" aria-label="Toggle completed"></button>
                            ${titleMarkup}
                        </div>
                        <div class="striver-prob-right">
                            ${videoBtn}
                            <button class="striver-btn-log" data-title="${prob.title}" title="Add to Spaced Repetition">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="12" y1="9" x2="12" y2="15"></line>
                                    <line x1="9" y1="12" x2="15" y2="12"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            });

            const isSubExpanded = expandedSubsteps.has(`${stepIdx}-${subIdx}`);
            const subExpandedClass = isSubExpanded ? 'expanded' : '';

            substepsHTML += `
                <div class="striver-substep-wrap ${subExpandedClass}" data-step-idx="${stepIdx}" data-sub-idx="${subIdx}">
                    <div class="striver-substep-header" data-step-idx="${stepIdx}" data-sub-idx="${subIdx}">
                        <span class="striver-substep-title">${sub.name}</span>
                        <svg class="substep-chevron" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                    <div class="striver-problems-list">
                        ${problemsHTML}
                    </div>
                </div>
            `;
        });

        stepEl.innerHTML = `
            <button class="striver-step-header" data-target="striver-step-${stepIdx}" data-index="${stepIdx}">
                <span class="striver-step-title">${stepData.step}</span>
                <span class="striver-step-progress">${stepCompletedCount} / ${stepTotalCount} Done</span>
            </button>
            <div class="striver-step-content">
                ${substepsHTML}
            </div>
        `;

        container.appendChild(stepEl);
    });

    // Update counts
    const countEl = document.getElementById('striverTrackerCount');
    if (countEl) countEl.textContent = `${totalCompleted} / ${totalQuestions} Completed`;

    // Accordion Toggle Event Listeners
    container.querySelectorAll('.striver-step-header').forEach(header => {
        header.addEventListener('click', (e) => {
            const cardId = e.currentTarget.getAttribute('data-target');
            const cardEl = document.getElementById(cardId);
            const stepIdx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
            if (cardEl) {
                const isExpanded = cardEl.classList.toggle('expanded');
                if (isExpanded) {
                    expandedSteps.add(stepIdx);
                } else {
                    expandedSteps.delete(stepIdx);
                }
            }
        });
    });

    // Substep Accordion Toggle Event Listeners
    container.querySelectorAll('.striver-substep-header').forEach(header => {
        header.addEventListener('click', (e) => {
            const subWrap = e.currentTarget.closest('.striver-substep-wrap');
            const stepIdx = parseInt(e.currentTarget.getAttribute('data-step-idx'), 10);
            const subIdx = parseInt(e.currentTarget.getAttribute('data-sub-idx'), 10);
            const key = `${stepIdx}-${subIdx}`;
            
            if (subWrap) {
                const isExpanded = subWrap.classList.toggle('expanded');
                if (isExpanded) {
                    expandedSubsteps.add(key);
                } else {
                    expandedSubsteps.delete(key);
                }
            }
        });
    });

    // Checkbox toggles
    container.querySelectorAll('.chk-striver-problem').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const title = e.currentTarget.getAttribute('data-title');
            const isCompleted = state.striverCompleted && state.striverCompleted[title];
            
            if (isCompleted) {
                if (state.striverCompleted) delete state.striverCompleted[title];
                showToast(`Unchecked: "${title}"`);
            } else {
                if (!state.striverCompleted) state.striverCompleted = {};
                state.striverCompleted[title] = true;
                showToast(`Completed problem: "${title}"!`);
            }
            saveState();
            renderStriverSheet();
        });
    });

    // Log to Spaced Repetition modal trigger via custom event
    container.querySelectorAll('.striver-btn-log').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const title = e.currentTarget.getAttribute('data-title');
            document.dispatchEvent(new CustomEvent('interval-open-quick-add', { detail: { title } }));
        });
    });

    // Re-apply search filter if there is an active search query
    const searchInput = document.getElementById('striverSearchInput');
    if (searchInput && searchInput.value.trim() !== '') {
        searchInput.dispatchEvent(new Event('input'));
    }
}
