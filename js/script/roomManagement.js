import { escapeHTML, timeToMinutes } from './utils.js';
import { showModal, closeModal, showConfirmDialog } from './modal.js';

/**
 * Renders the Verwaltung's room management view with three sub-tabs:
 * 1. Raumliste   – CRUD for rooms (US8, US9, US10, US11)
 * 2. Belegungsplan – Weekly schedule per room (US23)
 * 3. Auslastung  – Utilization statistics per room (US30)
 *
 * @param {object} data - The mockData object containing rooms, modules, etc.
 */
export function renderRoomManagement(data) {
    const container = document.querySelector('.admin-rooms-content');
    if (!container) return;

    const rooms = data.rooms;
    const totalSeats = rooms.reduce((sum, r) => sum + (r.seats || 0), 0);

    // Compute overall utilization for the current week (Mon-Fri)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffMon);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const dayOcc = countDayOccurrences(monday, friday);
    const weekdays = countWeekdays(monday, friday);
    const totalAvailable = rooms.length * weekdays * 9; // 9h per day (08:00-17:00)
    let totalBookedMin = 0;
    rooms.forEach(room => {
        const bookings = Array.isArray(room.bookings) ? room.bookings : [];
        bookings.forEach(b => {
            if (b.day >= 0 && b.day <= 4) {
                const dur = Math.max(0, timeToMinutes(b.end) - timeToMinutes(b.start));
                totalBookedMin += dur * (dayOcc[b.day] || 0);
            }
        });
    });
    const overallUtil = totalAvailable > 0
        ? Math.min(100, (totalBookedMin / 60 / totalAvailable) * 100).toFixed(1)
        : '0.0';

    container.innerHTML = `
        <div class="grid-container stats-row" style="margin-bottom: 1.5rem;">
            <div class="card stat-card">
                <div class="stat-icon primary-bg">
                    <span class="material-icons-round">meeting_room</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Räume gesamt</span>
                    <span class="stat-value">${rooms.length}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon success-bg">
                    <span class="material-icons-round">event_seat</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Sitzplätze gesamt</span>
                    <span class="stat-value">${totalSeats}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon warning-bg">
                    <span class="material-icons-round">speed</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Gesamtauslastung</span>
                    <span class="stat-value">${overallUtil}%</span>
                </div>
            </div>
        </div>

        <div class="management-tabs">
            <button class="management-tab active" data-tab="room-list">
                <span class="material-icons-round">list</span> Raumliste
            </button>
            <button class="management-tab" data-tab="room-schedule">
                <span class="material-icons-round">calendar_month</span> Belegungsplan
            </button>
            <button class="management-tab" data-tab="room-utilization">
                <span class="material-icons-round">bar_chart</span> Auslastung
            </button>
        </div>

        <div id="room-list" class="management-tab-content active"></div>
        <div id="room-schedule" class="management-tab-content"></div>
        <div id="room-utilization" class="management-tab-content"></div>
    `;

    initRoomTabs(container);
    renderRoomList(data);
    renderRoomSchedule(data);
    renderRoomUtilization(data);
}

// ---------------------------------------------------------------------------
// Tab Switching
// ---------------------------------------------------------------------------

/**
 * Initialises click handlers for the management sub-tabs inside the given
 * container.  Toggles .active on both the tab buttons and their panels.
 * @param {HTMLElement} container - The .admin-rooms-content element.
 */
function initRoomTabs(container) {
    const tabs = container.querySelectorAll('.management-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            container.querySelectorAll('.management-tab-content').forEach(panel => {
                panel.classList.remove('active');
            });
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });
}

// ---------------------------------------------------------------------------
// Tab 1 – Raumliste (US8, US9, US10, US11)
// ---------------------------------------------------------------------------

/**
 * Renders the inline create form and the sortable room table.
 * @param {object} data - The mockData object.
 */
function renderRoomList(data) {
    const panel = document.getElementById('room-list');
    if (!panel) return;

    const rooms = [...data.rooms].sort((a, b) => a.name.localeCompare(b.name, 'de'));

    panel.innerHTML = `
        <div class="card">
            <div class="card-header" style="margin-bottom: 1rem;">
                <h3>Neuen Raum anlegen</h3>
            </div>
            <form class="inline-create-form" id="room-create-form" autocomplete="off">
                <div class="form-group">
                    <label for="new-room-name">Raumname</label>
                    <input type="text" id="new-room-name" class="form-control" placeholder="z.B. Hörsaal 3" required>
                </div>
                <div class="form-group">
                    <label for="new-room-seats">Plätze</label>
                    <input type="number" id="new-room-seats" class="form-control" min="0" step="1" placeholder="0" required>
                </div>
                <div class="form-group">
                    <label for="new-room-exam-seats">Klausurplätze</label>
                    <input type="number" id="new-room-exam-seats" class="form-control" min="0" step="1" placeholder="0" required>
                </div>
                <button type="submit" class="btn btn-sm btn-primary">
                    <span class="material-icons-round">add</span> Anlegen
                </button>
            </form>
            <div id="room-create-error" class="management-alert error" style="display:none;"></div>
        </div>

        <div class="card" style="margin-top:1rem;">
            <div class="card-header" style="margin-bottom: 1rem;">
                <h3>Alle Räume</h3>
            </div>
            ${rooms.length === 0
                ? `<div class="management-empty">
                        <span class="material-icons-round">meeting_room</span>
                        <p>Noch keine Räume angelegt.</p>
                   </div>`
                : `<div style="overflow-x:auto;">
                    <table class="management-table" id="rooms-table">
                        <thead>
                            <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Plätze</th>
                                <th scope="col">Klausurplätze</th>
                                <th scope="col">Belegungen</th>
                                <th scope="col">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rooms.map(room => `
                                <tr data-room-id="${room.id}">
                                    <td style="font-weight:600;">${escapeHTML(room.name)}</td>
                                    <td>${room.seats}</td>
                                    <td>${room.examSeats}</td>
                                    <td>${Array.isArray(room.bookings) ? room.bookings.length : 0}</td>
                                    <td>
                                        <div class="actions-cell">
                                            <button class="btn-icon-only edit-room-btn" title="Bearbeiten" data-room-id="${room.id}">
                                                <span class="material-icons-round">edit</span>
                                            </button>
                                            <button class="btn-icon-only danger delete-room-btn" title="Löschen" data-room-id="${room.id}">
                                                <span class="material-icons-round">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                  </div>`
            }
        </div>
    `;

    // Bind create form
    const form = document.getElementById('room-create-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCreateRoom(data);
        });
    }

    // Bind edit buttons
    panel.querySelectorAll('.edit-room-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const roomId = parseInt(btn.dataset.roomId);
            openEditRoomModal(data, roomId);
        });
    });

    // Bind delete buttons
    panel.querySelectorAll('.delete-room-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const roomId = parseInt(btn.dataset.roomId);
            handleDeleteRoom(data, roomId);
        });
    });
}

/**
 * Validates and creates a new room from the inline form inputs.
 * @param {object} data - The mockData object.
 */
function handleCreateRoom(data) {
    const nameInput = document.getElementById('new-room-name');
    const seatsInput = document.getElementById('new-room-seats');
    const examSeatsInput = document.getElementById('new-room-exam-seats');
    const errorDiv = document.getElementById('room-create-error');

    const name = nameInput.value.trim();
    const seats = parseInt(seatsInput.value, 10);
    const examSeats = parseInt(examSeatsInput.value, 10);

    // Hide previous error
    if (errorDiv) errorDiv.style.display = 'none';

    // Validation
    if (!name) {
        showCreateError(errorDiv, 'Bitte einen Raumnamen eingeben.');
        nameInput.focus();
        return;
    }

    const duplicate = data.rooms.some(r => r.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
        showCreateError(errorDiv, `Ein Raum mit dem Namen "${escapeHTML(name)}" existiert bereits.`);
        nameInput.focus();
        return;
    }

    if (Number.isNaN(seats) || seats < 0 || !Number.isInteger(seats)) {
        showCreateError(errorDiv, 'Plätze müssen eine ganze Zahl >= 0 sein.');
        seatsInput.focus();
        return;
    }

    if (Number.isNaN(examSeats) || examSeats < 0 || !Number.isInteger(examSeats)) {
        showCreateError(errorDiv, 'Klausurplätze müssen eine ganze Zahl >= 0 sein.');
        examSeatsInput.focus();
        return;
    }

    if (examSeats > seats) {
        showCreateError(errorDiv, 'Klausurplätze dürfen die Gesamtplätze nicht übersteigen.');
        examSeatsInput.focus();
        return;
    }

    // Generate new unique ID
    const maxId = data.rooms.reduce((max, r) => Math.max(max, r.id || 0), 0);
    const newRoom = {
        id: maxId + 1,
        name: name,
        seats: seats,
        examSeats: examSeats,
        bookings: []
    };

    data.rooms.push(newRoom);
    renderRoomManagement(data);
}

/**
 * Shows an inline error message in the create form area.
 * @param {HTMLElement|null} errorDiv - The .management-alert element.
 * @param {string} message - The error text.
 */
function showCreateError(errorDiv, message) {
    if (!errorDiv) return;
    errorDiv.innerHTML = `<span class="material-icons-round" style="font-size:1.1rem;">error</span> ${message}`;
    errorDiv.style.display = 'flex';
}

/**
 * Opens a modal to edit the name, seats, and examSeats of an existing room.
 * @param {object} data - The mockData object.
 * @param {number} roomId - The ID of the room to edit.
 */
function openEditRoomModal(data, roomId) {
    const room = data.rooms.find(r => r.id === roomId);
    if (!room) return;

    const bodyHTML = `
        <form class="management-form" id="edit-room-form" autocomplete="off">
            <div class="form-group">
                <label for="edit-room-name">Raumname</label>
                <input type="text" id="edit-room-name" class="form-control" value="${escapeHTML(room.name)}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-room-seats">Plätze</label>
                    <input type="number" id="edit-room-seats" class="form-control" value="${room.seats}" min="0" step="1" required>
                </div>
                <div class="form-group">
                    <label for="edit-room-exam-seats">Klausurplätze</label>
                    <input type="number" id="edit-room-exam-seats" class="form-control" value="${room.examSeats}" min="0" step="1" required>
                </div>
            </div>
            <div id="edit-room-error" class="management-alert error" style="display:none;"></div>
        </form>
    `;

    const footerHTML = `
        <button class="btn btn-outline modal-cancel-btn" type="button">Abbrechen</button>
        <button class="btn btn-primary modal-save-btn" type="button">Speichern</button>
    `;

    showModal('Raum bearbeiten', bodyHTML, footerHTML);

    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    const cancelBtn = overlay.querySelector('.modal-cancel-btn');
    const saveBtn = overlay.querySelector('.modal-save-btn');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeModal(), { once: true });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            handleSaveRoom(data, room);
        }, { once: true });
    }
}

/**
 * Validates and persists changes from the edit-room modal.
 * @param {object} data - The mockData object.
 * @param {object} room - The room object being edited.
 */
function handleSaveRoom(data, room) {
    const nameInput = document.getElementById('edit-room-name');
    const seatsInput = document.getElementById('edit-room-seats');
    const examSeatsInput = document.getElementById('edit-room-exam-seats');
    const errorDiv = document.getElementById('edit-room-error');

    const name = nameInput.value.trim();
    const seats = parseInt(seatsInput.value, 10);
    const examSeats = parseInt(examSeatsInput.value, 10);

    if (errorDiv) errorDiv.style.display = 'none';

    if (!name) {
        showCreateError(errorDiv, 'Bitte einen Raumnamen eingeben.');
        nameInput.focus();
        return;
    }

    const duplicate = data.rooms.some(r => r.id !== room.id && r.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
        showCreateError(errorDiv, `Ein Raum mit dem Namen "${escapeHTML(name)}" existiert bereits.`);
        nameInput.focus();
        return;
    }

    if (Number.isNaN(seats) || seats < 0 || !Number.isInteger(seats)) {
        showCreateError(errorDiv, 'Plätze müssen eine ganze Zahl >= 0 sein.');
        seatsInput.focus();
        return;
    }

    if (Number.isNaN(examSeats) || examSeats < 0 || !Number.isInteger(examSeats)) {
        showCreateError(errorDiv, 'Klausurplätze müssen eine ganze Zahl >= 0 sein.');
        examSeatsInput.focus();
        return;
    }

    if (examSeats > seats) {
        showCreateError(errorDiv, 'Klausurplätze dürfen die Gesamtplätze nicht übersteigen.');
        examSeatsInput.focus();
        return;
    }

    room.name = name;
    room.seats = seats;
    room.examSeats = examSeats;

    closeModal();
    renderRoomManagement(data);
}

/**
 * Shows a confirmation dialog and deletes the room from data.rooms on confirm.
 * @param {object} data - The mockData object.
 * @param {number} roomId - The ID of the room to delete.
 */
function handleDeleteRoom(data, roomId) {
    const room = data.rooms.find(r => r.id === roomId);
    if (!room) return;

    showConfirmDialog(
        'Raum löschen',
        `Möchten Sie den Raum "${escapeHTML(room.name)}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
        () => {
            const index = data.rooms.findIndex(r => r.id === roomId);
            if (index !== -1) {
                data.rooms.splice(index, 1);
            }
            renderRoomManagement(data);
        }
    );
}

// ---------------------------------------------------------------------------
// Tab 2 – Belegungsplan (US23)
// ---------------------------------------------------------------------------

/** Module-level state for the schedule week offset. */
let scheduleWeekOffset = 0;

/**
 * Renders the room schedule tab with a room selector, week navigation,
 * and a simple weekly calendar grid (Mon-Fri, 08:00-17:00).
 * @param {object} data - The mockData object.
 */
function renderRoomSchedule(data) {
    const panel = document.getElementById('room-schedule');
    if (!panel) return;

    const rooms = [...data.rooms].sort((a, b) => a.name.localeCompare(b.name, 'de'));

    panel.innerHTML = `
        <div class="card">
            <div class="card-header" style="margin-bottom: 1rem;">
                <h3>Belegungsplan</h3>
            </div>
            <div class="room-schedule-controls">
                <select id="schedule-room-select" class="form-control">
                    ${rooms.length === 0
                        ? '<option value="">Keine Räume vorhanden</option>'
                        : rooms.map(r => `<option value="${r.id}">${escapeHTML(r.name)}</option>`).join('')
                    }
                </select>
                <button class="btn btn-outline btn-sm" id="schedule-prev-week">
                    <span class="material-icons-round">chevron_left</span> Vorige Woche
                </button>
                <span id="schedule-week-label" style="font-weight:600; font-size:0.9rem; color:var(--text-primary); white-space:nowrap;"></span>
                <button class="btn btn-outline btn-sm" id="schedule-next-week">
                    Nächste Woche <span class="material-icons-round">chevron_right</span>
                </button>
            </div>
            <div id="schedule-calendar-container" style="overflow-x:auto;"></div>
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

    // Build time column
    const timeRows = hours.map(h => `<div class="schedule-time-cell" style="height:60px; display:flex; align-items:flex-start; justify-content:flex-end; padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--text-tertiary); border-bottom:1px solid var(--border-color-subtle);">${h}</div>`).join('');

    // Booking color palette
    const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#ec4899'];

    // Build day columns
    const dayColumns = weekData.days.map((dayLabel, dayIndex) => {
        const dayBookings = bookings.filter(b => b.day === dayIndex);

        const bookingBlocks = dayBookings.map((b, bi) => {
            const startMin = timeToMinutes(b.start);
            const endMin = timeToMinutes(b.end);
            const top = (startMin - 480); // 08:00 = 480 min
            const height = endMin - startMin;
            const color = colors[bi % colors.length];

            return `<div style="
                position:absolute;
                top:${top}px;
                left:2px;
                right:2px;
                height:${height}px;
                background:${color};
                opacity:0.85;
                border-radius:4px;
                padding:0.2rem 0.35rem;
                font-size:0.7rem;
                color:#fff;
                overflow:hidden;
                cursor:default;
                line-height:1.3;
                box-sizing:border-box;
            " title="${escapeHTML(b.title)} (${escapeHTML(b.start)} - ${escapeHTML(b.end)})">
                <strong>${escapeHTML(b.title)}</strong><br>
                ${escapeHTML(b.start)} - ${escapeHTML(b.end)}
            </div>`;
        }).join('');

        const gridLines = hours.map(() =>
            `<div style="height:60px; border-bottom:1px solid var(--border-color-subtle);"></div>`
        ).join('');

        return `
            <div style="flex:1; min-width:120px;">
                <div style="text-align:center; font-weight:600; font-size:0.8rem; padding:0.5rem 0; border-bottom:2px solid var(--border-color); color:var(--text-primary);">${dayLabel}</div>
                <div style="position:relative;">
                    ${gridLines}
                    ${bookingBlocks}
                </div>
            </div>`;
    }).join('');

    container.innerHTML = `
        <div style="display:flex; border:1px solid var(--border-color); border-radius:var(--radius-lg); overflow:hidden; background:var(--surface-color);">
            <div style="width:55px; flex-shrink:0; border-right:1px solid var(--border-color);">
                <div style="height:33px; border-bottom:2px solid var(--border-color);"></div>
                ${timeRows}
            </div>
            ${dayColumns}
        </div>
    `;
}

// ---------------------------------------------------------------------------
// Tab 3 – Auslastung (US30)
// ---------------------------------------------------------------------------

/**
 * Renders the utilization tab with date-range inputs and per-room usage bars.
 * @param {object} data - The mockData object.
 */
function renderRoomUtilization(data) {
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
            <div class="card-header" style="margin-bottom: 1rem;">
                <h3>Raumauslastung</h3>
            </div>
            <div class="inline-create-form" style="margin-bottom:1.5rem;">
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
            <div class="management-alert error" style="display:flex;">
                <span class="material-icons-round" style="font-size:1.1rem;">error</span>
                Bitte gültigen Zeitraum auswählen (Startdatum <= Enddatum).
            </div>`;
        return;
    }

    // Count weekdays in range
    const weekdays = countWeekdays(startDate, endDate);
    const totalAvailableHours = weekdays * 9; // 8:00-17:00 = 9 hours per day

    if (totalAvailableHours === 0) {
        resultsDiv.innerHTML = `
            <div class="management-alert info" style="display:flex;">
                <span class="material-icons-round" style="font-size:1.1rem;">info</span>
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

/**
 * Counts the total number of weekdays (Mon-Fri) between two dates inclusive.
 * @param {Date} start - The start date.
 * @param {Date} end - The end date.
 * @returns {number} Number of weekdays.
 */
function countWeekdays(start, end) {
    let count = 0;
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endNorm = new Date(end);
    endNorm.setHours(0, 0, 0, 0);

    while (current <= endNorm) {
        const dow = current.getDay();
        if (dow >= 1 && dow <= 5) count++;
        current.setDate(current.getDate() + 1);
    }
    return count;
}

/**
 * Counts how many times each weekday (Mon=0..Fri=4) occurs in the date
 * range [start, end] inclusive.
 * @param {Date} start - The start date.
 * @param {Date} end - The end date.
 * @returns {number[]} Array of length 5 with occurrence counts.
 */
function countDayOccurrences(start, end) {
    const counts = [0, 0, 0, 0, 0];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endNorm = new Date(end);
    endNorm.setHours(0, 0, 0, 0);

    while (current <= endNorm) {
        const dow = current.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
        if (dow >= 1 && dow <= 5) {
            counts[dow - 1]++; // Map JS Sunday-based to Mon=0..Fri=4
        }
        current.setDate(current.getDate() + 1);
    }
    return counts;
}
