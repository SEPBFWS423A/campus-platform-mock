import { escapeHTML } from '../../../core/utils.js';
import { renderEventManagement } from './seriesCards.js';

/**
 * Checks whether two time ranges on the same day overlap.
 * @param {string} startA - Start time A (HH:MM).
 * @param {string} endA - End time A (HH:MM).
 * @param {string} startB - Start time B (HH:MM).
 * @param {string} endB - End time B (HH:MM).
 * @returns {boolean} True if ranges overlap.
 */
function timesOverlap(startA, endA, startB, endB) {
    return startA < endB && startB < endA;
}

// =========================================================================
// US22 – Automatic Room Planning (greedy algorithm)
// =========================================================================

/**
 * Runs the greedy automatic room planning algorithm.
 * For each unscheduled event across all series, finds the first available
 * room and timeslot (Mon–Fri, 09:00–17:00) that does not conflict with
 * existing bookings.
 * @param {object} data - The global mockData object.
 */
export function runAutoPlanning(data) {
    const resultDiv = document.getElementById('auto-plan-result');
    if (!resultDiv) return;

    // Collect all unscheduled events
    const unscheduled = [];
    data.eventSeries.forEach(series => {
        series.events.forEach(ev => {
            if (!ev.schedule || !ev.roomId) {
                unscheduled.push({ series, event: ev });
            }
        });
    });

    if (unscheduled.length === 0) {
        resultDiv.innerHTML = `
            <div class="management-alert" style="margin-top: 1rem; padding: 0.75rem 1rem; background: var(--surface-color); border-radius: 8px; color: var(--text-secondary);">
                <span class="material-icons-round" style="vertical-align: middle; margin-right: 0.25rem;">info</span>
                Alle Veranstaltungen sind bereits geplant.
            </div>`;
        return;
    }

    // Available time slots: every 30-minute-aligned block from 09:00 to 17:00
    const START_HOUR = 9;
    const END_HOUR = 17;

    let assigned = 0;
    const errors = [];

    for (const { series, event: ev } of unscheduled) {
        let placed = false;
        const durationMinutes = ev.duration || 90;

        // Try each day, then each start time, then each room
        for (let day = 0; day < 5 && !placed; day++) {
            for (let hour = START_HOUR; hour < END_HOUR && !placed; hour++) {
                for (let minute = 0; minute < 60 && !placed; minute += 30) {
                    const startStr = String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
                    const endTotalMin = hour * 60 + minute + durationMinutes;

                    // Must end by 17:00
                    if (endTotalMin > END_HOUR * 60) continue;

                    const endHour = Math.floor(endTotalMin / 60);
                    const endMinute = endTotalMin % 60;
                    const endStr = String(endHour).padStart(2, '0') + ':' + String(endMinute).padStart(2, '0');

                    // Try each room
                    for (const room of data.rooms) {
                        const conflict = room.bookings.some(b =>
                            b.day === day && timesOverlap(b.start, b.end, startStr, endStr)
                        );
                        if (!conflict) {
                            // Place the event
                            ev.schedule = { day, start: startStr, end: endStr };
                            ev.roomId = room.id;

                            room.bookings.push({
                                day,
                                start: startStr,
                                end: endStr,
                                title: ev.name,
                                eventSeriesId: series.id,
                                eventId: ev.id
                            });

                            placed = true;
                            assigned++;
                        }
                    }
                }
            }
        }

        if (!placed) {
            errors.push(ev.name);
        }
    }

    // Show result message
    let messageHTML = '';
    if (assigned > 0) {
        messageHTML += `
            <div class="management-alert" style="margin-top: 1rem; padding: 0.75rem 1rem; background: var(--success-light, #e8f5e9); border-radius: 8px; color: var(--success-color, #2e7d32);">
                <span class="material-icons-round" style="vertical-align: middle; margin-right: 0.25rem;">check_circle</span>
                ${assigned} Veranstaltung${assigned !== 1 ? 'en' : ''} erfolgreich eingeplant.
            </div>`;
    }
    if (errors.length > 0) {
        messageHTML += `
            <div class="management-alert" style="margin-top: 0.5rem; padding: 0.75rem 1rem; background: var(--error-light, #fbe9e7); border-radius: 8px; color: var(--error-color, #c62828);">
                <span class="material-icons-round" style="vertical-align: middle; margin-right: 0.25rem;">error</span>
                Kein freier Slot gefunden f\u00fcr: ${errors.map(n => escapeHTML(n)).join(', ')}
            </div>`;
    }

    resultDiv.innerHTML = messageHTML;

    // Re-render cards view
    renderEventManagement(data);
}
