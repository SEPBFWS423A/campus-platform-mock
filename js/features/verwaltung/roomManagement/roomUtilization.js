import { timeToMinutes, escapeHTML } from '../../../core/utils.js';
import { countWeekdays, countDayOccurrences } from './index.js';

/**
 * Renders the utilization tab with date-range inputs and per-room usage bars.
 * @param {object} data - The mockData object.
 */
export function renderRoomUtilization(data) {
    const panel = document.getElementById('room-utilization');
    if (!panel) return;

    // Default range: current week Mon-Fri
    const now = new Date();
    const day = now.getDay();
    const diffMon = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffMon);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const formatISO = (d) => d.toISOString().split('T')[0];

    panel.innerHTML = `
        <div class="card">
            <div class="card-header room-card-header">
                <h3>Raumauslastung</h3>
            </div>
            <div class="inline-create-form room-utilization-controls">
                <div class="form-group">
                    <label for="util-start-date">Startdatum</label>
                    <input type="date" id="util-start-date" class="form-control" value="${formatISO(monday)}">
                </div>
                <div class="form-group">
                    <label for="util-end-date">Enddatum</label>
                    <input type="date" id="util-end-date" class="form-control" value="${formatISO(friday)}">
                </div>
                <button class="btn btn-sm btn-primary" id="util-show-btn" type="button">
                    <span class="material-icons-round">search</span> Anzeigen
                </button>
            </div>
            <div class="room-utilization-legend">
                <span class="room-utilization-legend-title">Legende:</span>
                <span class="room-utilization-legend-item">
                    <span class="room-utilization-legend-swatch room-utilization-legend-low"></span> Niedrig (0-40%)
                </span>
                <span class="room-utilization-legend-item">
                    <span class="room-utilization-legend-swatch room-utilization-legend-medium"></span> Mittel (41-70%)
                </span>
                <span class="room-utilization-legend-item">
                    <span class="room-utilization-legend-swatch room-utilization-legend-high"></span> Hoch (71-100%)
                </span>
            </div>
            <div id="utilization-results"></div>
        </div>
    `;

    const showBtn = document.getElementById('util-show-btn');
    if (showBtn) {
        showBtn.addEventListener('click', () => {
            computeUtilization(data);
        });
    }

    // Render initial results
    computeUtilization(data);
}

/**
 * Computes and renders the utilization bars for each room within the
 * selected date range.
 *
 * Utilization % = (total booked hours in period) / (weekdays * 9 hrs) * 100
 * Each recurring booking is counted once per matching weekday in the range.
 *
 * @param {object} data - The mockData object.
 */
function computeUtilization(data) {
    const resultsDiv = document.getElementById('utilization-results');
    if (!resultsDiv) return;

    const startInput = document.getElementById('util-start-date');
    const endInput = document.getElementById('util-end-date');

    const startDate = new Date(startInput.value);
    const endDate = new Date(endInput.value);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
        resultsDiv.innerHTML = `
            <div class="management-alert error room-alert-visible">
                <span class="material-icons-round room-error-icon">error</span>
                Bitte gültigen Zeitraum auswählen (Startdatum <= Enddatum).
            </div>`;
        return;
    }

    // Count weekdays in range
    const weekdays = countWeekdays(startDate, endDate);
    const totalAvailableHours = weekdays * 9; // 8:00-17:00 = 9 hours per day

    if (totalAvailableHours === 0) {
        resultsDiv.innerHTML = `
            <div class="management-alert info room-alert-visible">
                <span class="material-icons-round room-error-icon">info</span>
                Keine Werktage im gewählten Zeitraum.
            </div>`;
        return;
    }

    // Count weekday occurrences per day-of-week (0=Mon..4=Fri)
    const dayOccurrences = countDayOccurrences(startDate, endDate);

    const rooms = [...data.rooms].sort((a, b) => a.name.localeCompare(b.name, 'de'));

    const items = rooms.map(room => {
        const bookings = Array.isArray(room.bookings) ? room.bookings : [];
        let totalBookedMinutes = 0;

        bookings.forEach(b => {
            if (b.day >= 0 && b.day <= 4) {
                const startMin = timeToMinutes(b.start);
                const endMin = timeToMinutes(b.end);
                const duration = Math.max(0, endMin - startMin);
                totalBookedMinutes += duration * (dayOccurrences[b.day] || 0);
            }
        });

        const bookedHours = totalBookedMinutes / 60;
        const utilization = Math.min(100, (bookedHours / totalAvailableHours) * 100);

        let fillClass = 'low';
        if (utilization > 70) fillClass = 'high';
        else if (utilization > 40) fillClass = 'medium';

        return `
            <div class="utilization-item">
                <span class="utilization-name">${escapeHTML(room.name)}</span>
                <div class="utilization-bar-wrapper">
                    <div class="utilization-bar-track">
                        <div class="utilization-bar-fill ${fillClass}" style="width:${utilization.toFixed(1)}%;"></div>
                    </div>
                    <span class="utilization-percent">${utilization.toFixed(1)}%</span>
                    <span class="utilization-hours">${bookedHours.toFixed(1)} h</span>
                </div>
            </div>`;
    }).join('');

    resultsDiv.innerHTML = `
        <div class="utilization-list">
            ${items}
        </div>
    `;
}
