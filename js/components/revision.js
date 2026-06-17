/* ==========================================================================
   INTERVAL 2.0 - SPACED REPETITION CARD & HEATMAP COMPONENT
   ========================================================================== */

import { state, getHabitStateForDate } from '../core/state.js';
import { saveState } from '../core/supabase.js';
import { showToast } from '../utils/toast.js';
import { getLocalDateString, getRelativeDateString, formatReadableDate, calculateStreak } from '../utils/date.js';

export let activeBucketFilter = 'today';

export function setActiveBucketFilter(filter) {
    activeBucketFilter = filter;
}

const BUCKET_INTERVALS = [1, 3, 7, 14, 30];

export function createRevisionCard(title, category, notes, initialDifficulty) {
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

    state.revisionCards.push(newCard);
    saveState();
    showToast(`"${title}" added to Spaced Repetition schedule!`);
}

export function logCardReview(cardId, response) {
    const cardIndex = state.revisionCards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    const card = state.revisionCards[cardIndex];
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
    
    card.history.push({
        date: todayStr,
        response,
        previousInterval: card.currentInterval,
        nextInterval
    });

    card.currentInterval = nextInterval;
    card.nextReviewDate = nextDate;

    saveState();
    showToast(`Card review logged: ${response.toUpperCase()}`);
    renderDashboard();
}

export function renderDashboard() {
    const todayStr = getLocalDateString();
    const tomorrowStr = getRelativeDateString(1);
    const weekStr = getRelativeDateString(7);

    const currentStreak = calculateStreak();
    const streakEl = document.getElementById('sidebarStreakVal');
    if (streakEl) streakEl.textContent = currentStreak;

    const buckets = {
        today: [],
        tomorrow: [],
        week: [],
        later: []
    };

    if (state.revisionCards) {
        state.revisionCards.forEach(card => {
            if (card.nextReviewDate <= todayStr) {
                buckets.today.push(card);
            } else if (card.nextReviewDate === tomorrowStr) {
                buckets.tomorrow.push(card);
            } else if (card.nextReviewDate > tomorrowStr && card.nextReviewDate <= weekStr) {
                buckets.week.push(card);
            } else {
                buckets.later.push(card);
            }
        });
    }

    const bToday = document.getElementById('badgeCountToday');
    const bTomorrow = document.getElementById('badgeCountTomorrow');
    const bWeek = document.getElementById('badgeCountWeek');
    const bLater = document.getElementById('badgeCountLater');

    if (bToday) bToday.textContent = buckets.today.length;
    if (bTomorrow) bTomorrow.textContent = buckets.tomorrow.length;
    if (bWeek) bWeek.textContent = buckets.week.length;
    if (bLater) bLater.textContent = buckets.later.length;

    const cardListContainer = document.getElementById('revisionCardsList');
    if (!cardListContainer) return;

    const activeCards = buckets[activeBucketFilter] || [];
    const emptyStateEl = document.getElementById('revisionEmptyState');
    cardListContainer.innerHTML = '';
    if (emptyStateEl) {
        cardListContainer.appendChild(emptyStateEl);
    }

    if (activeCards.length === 0) {
        if (emptyStateEl) emptyStateEl.style.display = 'flex';
    } else {
        if (emptyStateEl) emptyStateEl.style.display = 'none';
        
        activeCards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'revision-card';
            
            let notesHTML = '';
            if (card.notes) {
                notesHTML = `<p class="rev-card-notes">${card.notes}</p>`;
            }

            let actionHTML = '';
            if (card.nextReviewDate <= todayStr) {
                actionHTML = `
                    <div class="rev-card-actions">
                        <button class="btn-rate btn-rate-easy" data-id="${card.id}" data-rate="easy">Easy (7d)</button>
                        <button class="btn-rate btn-rate-medium" data-id="${card.id}" data-rate="medium">Medium (3d)</button>
                        <button class="btn-rate btn-rate-hard" data-id="${card.id}" data-rate="hard">Hard (1d)</button>
                    </div>
                `;
            }

            cardEl.innerHTML = `
                <div class="rev-card-header">
                    <div>
                        <h3 class="rev-card-title">${card.title}</h3>
                        <span class="rev-card-category">${card.category}</span>
                    </div>
                    <span class="rev-card-difficulty diff-${card.difficulty}">${card.difficulty}</span>
                </div>
                ${notesHTML}
                <div class="rev-card-meta">
                    <span class="rev-card-schedule">Scheduled: ${formatReadableDate(card.nextReviewDate)}</span>
                </div>
                ${actionHTML}
            `;
            
            cardListContainer.appendChild(cardEl);
        });

        cardListContainer.querySelectorAll('.btn-rate').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const rate = e.target.getAttribute('data-rate');
                logCardReview(id, rate);
            });
        });
    }

    const todayHabit = getHabitStateForDate(todayStr);
    
    const cardGym = document.getElementById('cardGymHabit');
    const gymSub = document.getElementById('gymStatusSubtitle');
    if (cardGym && gymSub) {
        if (todayHabit.gym) {
            cardGym.classList.add('completed');
            gymSub.textContent = `Completed: ${todayHabit.gymData.muscle} (${todayHabit.gymData.duration || 'Log Notes'})`;
        } else {
            cardGym.classList.remove('completed');
            gymSub.textContent = 'Log target muscles & performance';
            
            const mSel = document.getElementById('gymMuscle');
            const tInp = document.getElementById('gymTime');
            const nTxt = document.getElementById('gymNotes');
            if (mSel) mSel.value = 'Push';
            if (tInp) tInp.value = '';
            if (nTxt) nTxt.value = '';
        }
    }

    const cardComm = document.getElementById('cardCommHabit');
    const commSub = document.getElementById('commStatusSubtitle');
    if (cardComm && commSub) {
        if (todayHabit.comm) {
            cardComm.classList.add('completed');
            commSub.textContent = `Completed: ${todayHabit.commData.topic || 'Speaking Practice'}`;
        } else {
            cardComm.classList.remove('completed');
            commSub.textContent = 'Log practice details & video URLs';
            
            const tInp = document.getElementById('commTopic');
            const vInp = document.getElementById('commVideoUrl');
            if (tInp) tInp.value = '';
            if (vInp) vInp.value = '';
        }
    }

    renderHabitsHeatmap();
}

export function renderHabitsHeatmap() {
    const gridContainer = document.getElementById('heatmapGrid');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    
    const today = new Date();
    const cells = [];
    for (let i = 27; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = getLocalDateString(d);
        const habitData = state.habitsState ? state.habitsState[dateStr] : null;
        
        let completionLevel = 0;
        let habitsText = 'No habits completed';
        
        if (habitData) {
            let count = 0;
            const completedList = [];
            if (habitData.gym) {
                count++;
                completedList.push('🏋️ Gym');
            }
            if (habitData.comm) {
                count++;
                completedList.push('🗣️ Communication');
            }
            completionLevel = count;
            if (count > 0) {
                habitsText = `Completed: ${completedList.join(', ')}`;
            }
        }
        
        cells.push({
            dateStr,
            readableDate: formatReadableDate(dateStr),
            level: completionLevel,
            habitsText
        });
    }

    cells.forEach(cell => {
        const cellEl = document.createElement('div');
        cellEl.className = `heatmap-cell level-${cell.level}`;
        cellEl.setAttribute('data-tooltip', `${cell.readableDate} - ${cell.habitsText}`);
        gridContainer.appendChild(cellEl);
    });
}
