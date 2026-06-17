/**
 * Date and calendar utility functions for Interval.
 */

export function getLocalDateString(dateObj = new Date()) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getRelativeDateString(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return getLocalDateString(d);
}

export function formatReadableDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getEarliestDate(state) {
    let earliest = getLocalDateString(); // default to today
    
    if (state?.revisionCards) {
        state.revisionCards.forEach(card => {
            if (card.dateStudied && card.dateStudied < earliest) {
                earliest = card.dateStudied;
            }
            if (card.history) {
                card.history.forEach(h => {
                    if (h.date && h.date < earliest) {
                        earliest = h.date;
                    }
                });
            }
        });
    }
    
    if (state?.habitsState) {
        Object.keys(state.habitsState).forEach(dateStr => {
            if (dateStr < earliest) {
                earliest = dateStr;
            }
        });
    }
    
    return earliest;
}

export function calculateStreak(state) {
    if (!state) return 0;
    
    let streak = 0;
    let checkDate = new Date();
    const todayStr = getLocalDateString();
    
    // Check if the user completed anything today
    let todayData = state.habitsState ? state.habitsState[todayStr] : null;
    let todayCompleted = todayData && (todayData.gym || todayData.comm);
    
    let todayReviewed = false;
    if (state.revisionCards) {
        todayReviewed = state.revisionCards.some(card => 
            card.history && card.history.some(h => h.date === todayStr)
        );
    }

    // If nothing completed today, check from yesterday to see if current streak is intact
    if (!todayCompleted && !todayReviewed) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    const earliestDateStr = getEarliestDate(state);
    let daysChecked = 0;

    while (true) {
        const checkStr = getLocalDateString(checkDate);
        
        // Stop if we check a date before any logged data exists
        if (checkStr < earliestDateStr) {
            break;
        }

        // Active check: did they log a habit or complete a card review on this date?
        let dayData = state.habitsState ? state.habitsState[checkStr] : null;
        let habitCompleted = dayData && (dayData.gym || dayData.comm);
        
        let cardReviewed = false;
        if (state.revisionCards) {
            cardReviewed = state.revisionCards.some(card => 
                card.history && card.history.some(h => h.date === checkStr)
            );
        }

        if (habitCompleted || cardReviewed) {
            streak++;
        } else {
            // Forgiving check: was anything due on this day?
            let reviewWasDue = false;
            if (state.revisionCards) {
                reviewWasDue = state.revisionCards.some(card => {
                    const wasScheduled = card.nextReviewDate <= checkStr;
                    const wasReviewed = card.history && card.history.some(h => h.date <= checkStr);
                    return wasScheduled && !wasReviewed;
                });
            }

            // Forgive if nothing was due on that day
            if (reviewWasDue) {
                break; // Streak breaks
            }
        }
        
        // Move backward by 1 day
        checkDate.setDate(checkDate.getDate() - 1);
        daysChecked++;
        
        // Safety cap to prevent infinite loop
        if (streak > 365 || daysChecked > 365) break;
    }

    return streak;
}
