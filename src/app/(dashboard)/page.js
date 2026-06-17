'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppState } from '@/context/StateContext';
import { getLocalDateString, getRelativeDateString, formatReadableDate } from '@/utils/date';

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const {
        state,
        createRevisionCard,
        logCardReview,
        saveHabitState,
        showToast
    } = useAppState();

    const todayStr = getLocalDateString();
    const tomorrowStr = getRelativeDateString(1);
    const weekStr = getRelativeDateString(7);

    // ─── Component States ────────────────────────────────────────────────────
    const [activeBucket, setActiveBucket] = useState('today');
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [isGymExpanded, setIsGymExpanded] = useState(false);
    const [isCommExpanded, setIsCommExpanded] = useState(false);

    // Form states: Quick Add Card
    const [cardTitle, setCardTitle] = useState('');
    const [cardCategory, setCardCategory] = useState('');
    const [cardDifficulty, setCardDifficulty] = useState('low');
    const [cardNotes, setCardNotes] = useState('');

    // Form states: Gym log
    const [gymMuscle, setGymMuscle] = useState('Push');
    const [gymDuration, setGymDuration] = useState('');
    const [gymNotes, setGymNotes] = useState('');
    const [appliedPresetDay, setAppliedPresetDay] = useState(null);

    // Form states: Comm log
    const [commTopic, setCommTopic] = useState('');
    const [commVideoUrl, setCommVideoUrl] = useState('');

    // ─── Query Prefill check ──────────────────────────────────────────────────
    useEffect(() => {
        const prefillAdd = searchParams.get('add');
        if (prefillAdd) {
            setCardTitle(prefillAdd);
            setCardCategory('DSA');
            setCardDifficulty('medium');
            setCardNotes('Striver DSA Problem');
            setIsQuickAddOpen(true);
            
            // Clear search params
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [searchParams]);

    // ─── Workload Bucket Calculations ─────────────────────────────────────────
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

    const activeCards = buckets[activeBucket] || [];

    // ─── Habits consistency heatmap generator ─────────────────────────────────
    const generateHeatmapCells = () => {
        const cells = [];
        const today = new Date();
        for (let i = 27; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = getLocalDateString(d);
            const habitData = state.habitsState ? state.habitsState[dateStr] : null;
            
            let level = 0;
            let text = 'No habits completed';
            
            if (habitData) {
                const completed = [];
                if (habitData.gym) completed.push('🏋️ Gym');
                if (habitData.comm) completed.push('🗣️ Communication');
                
                level = completed.length;
                if (level > 0) {
                    text = `Completed: ${completed.join(', ')}`;
                }
            }
            
            cells.push({
                dateStr,
                readable: formatReadableDate(dateStr),
                level,
                text
            });
        }
        return cells;
    };

    const heatmapCells = generateHeatmapCells();

    // ─── Gym Presets Chip Strip ───────────────────────────────────────────────
    const renderPresetsStrip = () => {
        const schedule = state.gymSchedule || {};
        const todayDayIndex = new Date().getDay();
        const renderOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon to Sun order
        
        const abbreviations = {
            1: 'M', 2: 'T', 3: 'W', 4: 'Th', 5: 'F', 6: 'Sa', 0: 'Su'
        };
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        let hasAnyPreset = Object.values(schedule).some(p => p.muscle || p.time);

        return (
            <>
                {!hasAnyPreset && (
                    <p className="schedule-first-run-hint" style={{ display: 'block', marginBottom: '12px' }}>
                        Tap a chip to apply a preset, or set up your schedule in <Link href="/settings" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Settings</Link>.
                    </p>
                )}
                <div className="gym-preset-strip" id="gymPresetStrip" style={{ marginBottom: '16px' }}>
                    {renderOrder.map(dayIndex => {
                        const preset = schedule[dayIndex];
                        const isToday = dayIndex === todayDayIndex;
                        const isConfigured = preset && (preset.muscle || preset.time);
                        
                        let classes = 'gym-preset-chip';
                        if (isToday) classes += ' today';
                        if (isConfigured) classes += ' configured';
                        else classes += ' unset';
                        if (appliedPresetDay === dayIndex) classes += ' applied';

                        const handleChipClick = () => {
                            if (isConfigured) {
                                setGymMuscle(preset.muscle || 'Push');
                                setGymDuration(preset.time || '');
                                setAppliedPresetDay(dayIndex);
                                showToast(`Applied preset for ${weekdays[dayIndex]}`);
                            } else {
                                setGymMuscle('Push');
                                setGymDuration('');
                                setAppliedPresetDay(null);
                                showToast(`Cleared gym tracker fields`);
                            }
                        };

                        return (
                            <div 
                                key={dayIndex} 
                                className={classes} 
                                data-day={dayIndex}
                                onClick={handleChipClick}
                            >
                                <span className="gym-preset-day">{abbreviations[dayIndex]}</span>
                                <span 
                                    className="gym-preset-focus" 
                                    title={isConfigured && preset.muscle ? preset.muscle : undefined}
                                >
                                    {isConfigured && preset.muscle ? preset.muscle : isConfigured && preset.time ? preset.time : '—'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </>
        );
    };

    // Auto apply today's preset on accordion expand
    const handleGymAccordionToggle = () => {
        const nextState = !isGymExpanded;
        setIsGymExpanded(nextState);
        
        if (nextState && gymMuscle === 'Push' && gymDuration.trim() === '') {
            const todayDayIndex = new Date().getDay();
            const todayPreset = state.gymSchedule && state.gymSchedule[todayDayIndex];
            if (todayPreset && (todayPreset.muscle || todayPreset.time)) {
                if (todayPreset.muscle) setGymMuscle(todayPreset.muscle);
                if (todayPreset.time) setGymDuration(todayPreset.time);
                setAppliedPresetDay(todayDayIndex);
                showToast("Auto-applied today's schedule preset!");
            }
        }
    };

    // ─── Log Handlers ────────────────────────────────────────────────────────
    const handleSaveCard = () => {
        if (!cardTitle.trim()) {
            showToast('Please enter a card title.', 'danger');
            return;
        }
        createRevisionCard(cardTitle, cardCategory, cardNotes, cardDifficulty);
        setIsQuickAddOpen(false);
        setCardTitle('');
        setCardCategory('');
        setCardNotes('');
        setCardDifficulty('low');
    };

    const handleSaveGym = () => {
        const data = { muscle: gymMuscle, duration: gymDuration, notes: gymNotes };
        saveHabitState(todayStr, 'gym', true, data);
        setIsGymExpanded(false);
        showToast('Gym workout logged successfully!');
    };

    const handleSaveComm = () => {
        if (commVideoUrl && !commVideoUrl.startsWith('http')) {
            showToast('Please enter a valid URL (starting with http/https).', 'danger');
            return;
        }
        const data = { topic: commTopic, videoUrl: commVideoUrl };
        saveHabitState(todayStr, 'comm', true, data);
        setIsCommExpanded(false);
        showToast('Speaking practice logged successfully!');
    };

    // Today status check
    const todayHabit = state.habitsState?.[todayStr] || { gym: false, gymData: {}, comm: false, commData: {} };

    return (
        <section className="view-section active">
            <div className="dashboard-grid">
                
                {/* Spaced Repetition Workload Column */}
                <div className="dashboard-col" id="colRevision">
                    <div className="col-header-row">
                        <h2 className="section-title">Spaced Repetition</h2>
                        <button 
                            className="btn-action-add" 
                            id="btnQuickAddCard" 
                            title="Add custom revision card"
                            onClick={() => setIsQuickAddOpen(true)}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>Add Topic</span>
                        </button>
                    </div>

                    {/* Bucket Filters */}
                    <div className="bucket-filter-bar">
                        {['today', 'tomorrow', 'week', 'later'].map(b => {
                            const labels = { today: 'Today', tomorrow: 'Tomorrow', week: 'This Week', later: 'Future' };
                            return (
                                <button 
                                    key={b} 
                                    className={`bucket-tab ${activeBucket === b ? 'active' : ''}`}
                                    onClick={() => setActiveBucket(b)}
                                >
                                    <span className="bucket-tab-name">{labels[b]}</span>
                                    <span className="bucket-badge">{buckets[b].length}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Cards List */}
                    <div className="revision-cards-list" id="revisionCardsList">
                        {activeCards.length === 0 ? (
                            <div className="empty-state" id="revisionEmptyState" style={{ display: 'flex' }}>
                                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none" className="empty-icon">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                <h3 className="empty-title">Your desk is clear!</h3>
                                <p className="empty-desc">No cards scheduled in this bucket. Go to the Striver DSA sheet or add a custom card to begin.</p>
                                <Link href="/striver" className="btn btn-primary">
                                    Browse Striver Sheet
                                </Link>
                            </div>
                        ) : (
                            activeCards.map(card => (
                                <div key={card.id} className="revision-card">
                                    <div className="rev-card-header">
                                        <div>
                                            <h3 className="rev-card-title">{card.title}</h3>
                                            <span className="rev-card-category">{card.category}</span>
                                        </div>
                                        <span className={`rev-card-difficulty diff-${card.difficulty}`}>
                                            {card.difficulty}
                                        </span>
                                    </div>
                                    {card.notes && <p className="rev-card-notes">{card.notes}</p>}
                                    <div className="rev-card-meta">
                                        <span className="rev-card-schedule">
                                            Scheduled: {formatReadableDate(card.nextReviewDate)}
                                        </span>
                                    </div>
                                    {card.nextReviewDate <= todayStr && (
                                        <div className="rev-card-actions">
                                            <button 
                                                className="btn-rate btn-rate-easy" 
                                                onClick={() => logCardReview(card.id, 'easy')}
                                            >
                                                Easy (7d)
                                            </button>
                                            <button 
                                                className="btn-rate btn-rate-medium" 
                                                onClick={() => logCardReview(card.id, 'medium')}
                                            >
                                                Medium (3d)
                                            </button>
                                            <button 
                                                className="btn-rate btn-rate-hard" 
                                                onClick={() => logCardReview(card.id, 'hard')}
                                            >
                                                Hard (1d)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Daily Habits & Timeline Column */}
                <div className="dashboard-col" id="colHabits">
                    <h2 className="section-title">Daily Habits</h2>

                    {/* Gym Accordion Card */}
                    <div className={`habit-accordion card ${todayHabit.gym ? 'completed' : ''} ${isGymExpanded ? 'expanded' : ''}`} id="cardGymHabit">
                        <button className="habit-accordion-header" id="btnToggleGym" onClick={handleGymAccordionToggle}>
                            <div className="habit-header-left">
                                <span className="habit-emoji">🏋️</span>
                                <div className="habit-header-texts">
                                    <h3 className="habit-title">Gym Tracker</h3>
                                    <p className="habit-subtitle" id="gymStatusSubtitle">
                                        {todayHabit.gym 
                                            ? `Completed: ${todayHabit.gymData?.muscle} (${todayHabit.gymData?.duration || 'Log Notes'})`
                                            : 'Log target muscles & performance'}
                                    </p>
                                </div>
                            </div>
                            <div className="habit-header-right">
                                <span className="habit-checkbox-visual" id="chkGymVisual"></span>
                                <svg className="chevron-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </button>
                        <div className="habit-accordion-content" id="gymAccordionContent">
                            {renderPresetsStrip()}
                            <div className="habit-form-group">
                                <label htmlFor="gymMuscle" className="habit-label">Muscle Focus</label>
                                <select 
                                    id="gymMuscle" 
                                    className="form-control"
                                    value={gymMuscle}
                                    onChange={(e) => setGymMuscle(e.target.value)}
                                >
                                    <option value="Push">Push (Chest / Shoulders / Triceps)</option>
                                    <option value="Pull">Pull (Back / Biceps)</option>
                                    <option value="Legs">Legs / Core</option>
                                    <option value="Cardio">Cardio / Endurance</option>
                                    <option value="Rest">Rest / Recovery</option>
                                </select>
                            </div>
                            <div className="habit-form-group">
                                <label htmlFor="gymTime" className="habit-label">Workout Duration</label>
                                <input 
                                    type="text" 
                                    id="gymTime" 
                                    className="form-control" 
                                    placeholder="e.g. 60 mins, 5 AM - 6:30 AM"
                                    value={gymDuration}
                                    onChange={(e) => setGymDuration(e.target.value)}
                                />
                            </div>
                            <div className="habit-form-group">
                                <label htmlFor="gymNotes" className="habit-label">Performance Notes</label>
                                <textarea 
                                    id="gymNotes" 
                                    className="form-control" 
                                    rows="2" 
                                    placeholder="e.g. Hit squat PR, felt energetic..."
                                    value={gymNotes}
                                    onChange={(e) => setGymNotes(e.target.value)}
                                />
                            </div>
                            <button className="btn btn-primary btn-block" id="btnSaveGym" onClick={handleSaveGym}>
                                Log Gym Workout
                            </button>
                        </div>
                    </div>

                    {/* Communication Accordion Card */}
                    <div className={`habit-accordion card ${todayHabit.comm ? 'completed' : ''} ${isCommExpanded ? 'expanded' : ''}`} id="cardCommHabit">
                        <button className="habit-accordion-header" id="btnToggleComm" onClick={() => setIsCommExpanded(!isCommExpanded)}>
                            <div className="habit-header-left">
                                <span className="habit-emoji">🗣️</span>
                                <div className="habit-header-texts">
                                    <h3 className="habit-title">Communication</h3>
                                    <p className="habit-subtitle" id="commStatusSubtitle">
                                        {todayHabit.comm 
                                            ? `Completed: ${todayHabit.commData?.topic || 'Speaking Practice'}`
                                            : 'Log practice details & video URLs'}
                                    </p>
                                </div>
                            </div>
                            <div className="habit-header-right">
                                <span className="habit-checkbox-visual" id="chkCommVisual"></span>
                                <svg className="chevron-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </button>
                        <div className="habit-accordion-content" id="commAccordionContent">
                            <div className="habit-form-group">
                                <label htmlFor="commTopic" className="habit-label">Topic / Content Practiced</label>
                                <input 
                                    type="text" 
                                    id="commTopic" 
                                    className="form-control" 
                                    placeholder="e.g. Speech practice, mock presentation..."
                                    value={commTopic}
                                    onChange={(e) => setCommTopic(e.target.value)}
                                />
                            </div>
                            <div className="habit-form-group">
                                <label htmlFor="commVideoUrl" className="habit-label">Instagram / Practice Video URL</label>
                                <input 
                                    type="url" 
                                    id="commVideoUrl" 
                                    className="form-control" 
                                    placeholder="https://instagram.com/reels/... or practice link"
                                    value={commVideoUrl}
                                    onChange={(e) => setCommVideoUrl(e.target.value)}
                                />
                            </div>
                            <button className="btn btn-primary btn-block" id="btnSaveComm" onClick={handleSaveComm}>
                                Log Practice
                            </button>
                        </div>
                    </div>

                    {/* Consistency Heatmap Timeline */}
                    <div className="timeline-card card">
                        <h3 className="timeline-title">Habits Consistency</h3>
                        <p className="timeline-subtitle">Daily completion over the past 4 weeks (28 days)</p>
                        
                        <div className="heatmap-wrapper">
                            <div className="heatmap-y-labels">
                                <span>Mon</span>
                                <span>Wed</span>
                                <span>Fri</span>
                                <span>Sun</span>
                            </div>
                            <div className="heatmap-grid" id="heatmapGrid">
                                {heatmapCells.map((cell, idx) => (
                                    <div 
                                        key={idx}
                                        className={`heatmap-cell level-${cell.level}`}
                                        data-tooltip={`${cell.readable} - ${cell.text}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="heatmap-legend">
                            <span>Less Consistent</span>
                            <div className="legend-scale">
                                <span className="legend-cell level-0" title="0 habits completed"></span>
                                <span className="legend-cell level-1" title="1 habit completed"></span>
                                <span className="legend-cell level-2" title="2 habits completed"></span>
                            </div>
                            <span>More Consistent</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Add Custom Topic Modal */}
            <div className={`modal-backdrop ${isQuickAddOpen ? 'active' : ''}`} id="modalQuickAdd">
                <div className="modal card">
                    <div className="modal-header">
                        <h3 className="modal-title">Create Revision Card</h3>
                        <button className="btn-close-modal" id="btnCancelQuickAdd" onClick={() => setIsQuickAddOpen(false)}>
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="form-group">
                            <label htmlFor="modalTopicTitle" className="form-label">Topic / Question Title *</label>
                            <input 
                                type="text" 
                                id="modalTopicTitle" 
                                className="form-control" 
                                placeholder="e.g. Reverse Linked List, CSS Grid Centering..."
                                value={cardTitle}
                                onChange={(e) => setCardTitle(e.target.value)}
                            />
                        </div>
                        <div className="form-group mt-4">
                            <label htmlFor="modalTopicCategory" className="form-label">Subject / Category</label>
                            <input 
                                type="text" 
                                id="modalTopicCategory" 
                                className="form-control" 
                                placeholder="e.g. Data Structures, CSS, Javascript"
                                value={cardCategory}
                                onChange={(e) => setCardCategory(e.target.value)}
                                list="modal-categories-list"
                            />
                            <datalist id="modal-categories-list">
                                <option value="Data Structures"></option>
                                <option value="Algorithms"></option>
                                <option value="CSS"></option>
                                <option value="Javascript"></option>
                                <option value="General"></option>
                            </datalist>
                        </div>
                        <div className="form-group mt-4">
                            <label className="form-label">Difficulty / Understanding Level</label>
                            <div className="difficulty-level-select">
                                <label className="diff-btn-label">
                                    <input 
                                        type="radio" 
                                        name="modalDifficulty" 
                                        value="low" 
                                        checked={cardDifficulty === 'low'}
                                        onChange={() => setCardDifficulty('low')}
                                    />
                                    <span className="diff-btn-visual diff-visual-low">Easy</span>
                                </label>
                                <label className="diff-btn-label">
                                    <input 
                                        type="radio" 
                                        name="modalDifficulty" 
                                        value="medium"
                                        checked={cardDifficulty === 'medium'}
                                        onChange={() => setCardDifficulty('medium')}
                                    />
                                    <span className="diff-btn-visual diff-visual-medium">Medium</span>
                                </label>
                                <label className="diff-btn-label">
                                    <input 
                                        type="radio" 
                                        name="modalDifficulty" 
                                        value="high"
                                        checked={cardDifficulty === 'high'}
                                        onChange={() => setCardDifficulty('high')}
                                    />
                                    <span className="diff-btn-visual diff-visual-high">Hard</span>
                                </label>
                            </div>
                        </div>
                        <div className="form-group mt-4">
                            <label htmlFor="modalTopicNotes" className="form-label">Key Recall Notes</label>
                            <textarea 
                                id="modalTopicNotes" 
                                className="form-control" 
                                rows="3" 
                                placeholder="Key details or questions you need to recall next time."
                                value={cardNotes}
                                onChange={(e) => setCardNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" id="btnCancelQuickAdd2" onClick={() => setIsQuickAddOpen(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" id="btnSaveQuickAdd" onClick={handleSaveCard}>
                            Log & Schedule
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Loading Dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
