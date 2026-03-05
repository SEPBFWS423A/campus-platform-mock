import { timeToMinutes, escapeHTML } from '../../../core/utils.js';

/** Module-level state for the schedule week offset. */
let scheduleWeekOffset = 0;

/**
 * Renders the room schedule tab with a room selector, week navigation,
 * and a simple weekly calendar grid (Mon-Fri, 08:00-17:00).
 * @param {object} data - The mockData object.
 */
export function renderRoomSchedule(data) {
    const panel = document.getElementById('room-schedule');
    if (!panel) return;

    const rooms = [...data.rooms].sort((a, b) => a.name.localeCompare(b.name, 'de'));

    panel.innerHTML = `
        <div class="card">
            <div class="card-header room-card-header">
                <h3>Belegungsplan</h3>
            </div>
            <div class="room-schedule-controls">
                <select id="schedule-room-select" class="form-control">
                    ${rooms.length === 0
                        ? '<option value="">Keine Räume vorhanden</option>'
                        : rooms.map(r => `<option value="${r.id}">${escapeHTML(r.name)}</option>`).join('')
                    }
                </select>
                <div class="room-schedule-nav">
                    <button class="btn btn-outline btn-sm" id="schedule-prev-week">
                        <span class="material-icons-round">chevron_left</span> Vorige Woche
                    </button>
                    <span id="schedule-week-label" class="room-schedule-week-label"></span>
                    <button class="btn btn-outline btn-sm" id="schedule-next-week">
                        Nächste Woche <span class="material-icons-round">chevron_right</span>
                    </button>
                </div>
            </div>
            <div id="schedule-calendar-container" class="room-calendar-scroll-wrapper"></div>
        </div>
    `;

    const select = document.getElementById('schedule-room-select');
    const prevBtn = document.getElementById('schedule-prev-week');
    const nextBtn = document.getElementById('schedule-next-week');

    const updateCalendar = () => {
        const roomId = parseInt(select.value, 10);
        const room = data.rooms.find(r => r.id === roomId);
        renderWeeklyCalendar(room);
    };

    if (select) select.addEventListener('change', updateCalendar);

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            scheduleWeekOffset--;
            updateCalendar();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            scheduleWeekOffset++;
            updateCalendar();
        });
    }

    // Initial render
    updateCalendar();
}

/**
 * Calculates week metadata (label and day headers) for the current date
 * shifted by {@link scheduleWeekOffset} weeks.
 * @returns {{ label: string, days: string[], monday: Date }}
 */
function getWeekData() {
    const now = new Date();
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff + scheduleWeekOffset * 7);

    // ISO week number
    const jan4 = new Date(monday.getFullYear(), 0, 4);
    const dayOfYear = Math.floor((monday - new Date(monday.getFullYear(), 0, 1)) / 86400000);
    const weekNumber = Math.ceil((dayOfYear + jan4.getDay()) / 7);

    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
    const days = [];
    for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        days.push(`${dayNames[i]} ${dd}.${mm}`);
    }

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const monDD = String(monday.getDate()).padStart(2, '0');
    const monMM = String(monday.getMonth() + 1).padStart(2, '0');
    const friDD = String(friday.getDate()).padStart(2, '0');
    const friMM = String(friday.getMonth() + 1).padStart(2, '0');

    const label = `KW ${weekNumber} (${monDD}.${monMM} - ${friDD}.${friMM})`;
    return { label, days, monday };
}

/** Booking color palette class indices 0-6 */
const CALENDAR_COLOR_COUNT = 7;

/**
 * Renders the weekly calendar grid for the given room into the
 * #schedule-calendar-container element.
 * @param {object|undefined} room - The room with its bookings array.
 */
function renderWeeklyCalendar(room) {
    const container = document.getElementById('schedule-calendar-container');
    const weekLabel = document.getElementById('schedule-week-label');
    if (!container) return;

    const weekData = getWeekData();
    if (weekLabel) weekLabel.textContent = weekData.label;

    if (!room) {
        container.innerHTML = `
            <div class="management-empty">
                <span class="material-icons-round">event_busy</span>
                <p>Kein Raum ausgewählt.</p>
            </div>`;
        return;
    }

    const bookings = Array.isArray(room.bookings) ? room.bookings : [];
    const hours = [];
    for (let h = 8; h <= 17; h++) {
        hours.push(`${String(h).padStart(2, '0')}:00`);
    }

    // Build time column cells
    const timeRows = hours.map(h =>
        `<div class="room-calendar-hour-cell room-calendar-time-label">${h}</div>`
    ).join('');

    // Build day columns
    const dayColumns = weekData.days.map((dayLabel, dayIndex) => {
        const dayBookings = bookings.filter(b => b.day === dayIndex);

        const bookingBlocks = dayBookings.map((b, bi) => {
            const startMin = timeToMinutes(b.start);
            const endMin = timeToMinutes(b.end);
            const top = startMin - 480; // 08:00 = 480 min
            const height = endMin - startMin;
            const colorClass = `room-calendar-event-${bi % CALENDAR_COLOR_COUNT}`;

            return `<div class="room-calendar-event ${colorClass}"
                style="top:${top}px;height:${height}px;"
                title="${escapeHTML(b.title)} (${escapeHTML(b.start)} - ${escapeHTML(b.end)})">
                <strong>${escapeHTML(b.title)}</strong>
                <span class="room-calendar-event-time">${escapeHTML(b.start)} - ${escapeHTML(b.end)}</span>
            </div>`;
        }).join('');

        const gridLines = hours.map(() =>
            `<div class="room-calendar-hour-cell"></div>`
        ).join('');

        return `
            <div class="room-calendar-day-col">
                <div class="room-calendar-day-header">${dayLabel}</div>
                <div class="room-calendar-day-body">
                    ${gridLines}
                    ${bookingBlocks}
                </div>
            </div>`;
    }).join('');

    container.innerHTML = `
        <div class="room-calendar">
            <div class="room-calendar-time-col">
                <div class="room-calendar-time-header"></div>
                ${timeRows}
            </div>
            ${dayColumns}
        </div>
    `;
}
