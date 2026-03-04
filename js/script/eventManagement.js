import { escapeHTML } from './utils.js';
import { showModal, closeModal, showConfirmDialog } from './modal.js';

/**
 * Day index to German day name mapping.
 * 0 = Montag, 1 = Dienstag, ..., 4 = Freitag
 */
const DAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const DAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];

// =========================================================================
// Helper functions
// =========================================================================

/**
 * Looks up a room name by its ID.
 * @param {Array} rooms - The rooms array from mockData.
 * @param {number|null} roomId - The room ID to look up.
 * @returns {string} The room name or '-' if not found.
 */
function getRoomName(rooms, roomId) {
    if (roomId == null) return '-';
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : '-';
}

/**
 * Formats a schedule object for display.
 * @param {object|null} schedule - Schedule with day, start, end.
 * @returns {string} Formatted schedule string.
 */
function formatSchedule(schedule) {
    if (!schedule) return 'Nicht geplant';
    return `${DAY_SHORT[schedule.day]} ${schedule.start}\u2013${schedule.end}`;
}

/**
 * Builds HTML meta-item spans for event detail display (duration, schedule, room).
 * Each item has a small icon for better visual recognition.
 * @param {object} ev - The event object.
 * @param {Array} rooms - The rooms array.
 * @returns {string} HTML string with meta items.
 */
function buildEventMeta(ev, rooms) {
    const durationHTML = `<span class="meta-item">
        <span class="material-icons-round">timer</span>${ev.duration} min
    </span>`;

    const scheduleHTML = ev.schedule
        ? `<span class="meta-item">
            <span class="material-icons-round">schedule</span>${DAY_SHORT[ev.schedule.day]} ${ev.schedule.start}\u2013${ev.schedule.end}
          </span>`
        : `<span class="meta-item unplanned">
            <span class="material-icons-round">event_busy</span>Nicht geplant
          </span>`;

    const roomName = getRoomName(rooms, ev.roomId);
    const roomHTML = ev.roomId != null
        ? `<span class="meta-item">
            <span class="material-icons-round">meeting_room</span>${escapeHTML(roomName)}
          </span>`
        : `<span class="meta-item unplanned">
            <span class="material-icons-round">meeting_room</span>Kein Raum
          </span>`;

    return `${durationHTML}${scheduleHTML}${roomHTML}`;
}

/**
 * Generates the next unique ID within an array of objects with id properties.
 * @param {Array<{id: number}>} items - Array of items with id fields.
 * @returns {number} Next available ID.
 */
function nextId(items) {
    if (!items || items.length === 0) return 1;
    return Math.max(...items.map(i => i.id)) + 1;
}

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
// Main render function (US12–US22)
// =========================================================================

/**
 * Renders the complete event series management view for the Verwaltung role.
 * Targets the .admin-events-content container.
 *
 * Covers user stories US12 through US22:
 *   US12 – Create event series
 *   US13 – Delete event series
 *   US14 – Assign students to series
 *   US15 – Remove students from series
 *   US16 – Add events to a series
 *   US17 – Remove events from a series
 *   US18 – Reorder events within a series
 *   US19 – Toggle event type (Klausur / Lehrveranstaltung)
 *   US20 – Edit event duration
 *   US21 – Edit event booking (room, day, time)
 *   US22 – Automatic room planning
 *
 * @param {object} data - The global mockData object.
 */
export function renderEventManagement(data) {
    const container = document.querySelector('.admin-events-content');
    if (!container) return;

    const seriesSorted = [...data.eventSeries].sort((a, b) =>
        a.name.localeCompare(b.name, 'de')
    );

    // -----------------------------------------------------------------
    // Build series cards HTML
    // -----------------------------------------------------------------
    const cardsHTML = seriesSorted.map(series => {
        const studentCount = series.studentIds ? series.studentIds.length : 0;
        const sortedEvents = [...series.events].sort((a, b) => a.order - b.order);

        const eventsListHTML = sortedEvents.length > 0
            ? sortedEvents.map(ev => {
                const typeBadgeClass = ev.type === 'Klausur' ? 'klausur' : 'lehrveranstaltung';
                return `
                    <div class="event-list-item">
                        <div class="event-list-item-info">
                            <div class="event-list-item-header">
                                <span class="type-badge ${escapeHTML(typeBadgeClass)}">${escapeHTML(ev.type)}</span>
                                <span class="event-list-item-name">${escapeHTML(ev.name)}</span>
                            </div>
                            <div class="event-list-item-meta">
                                ${buildEventMeta(ev, data.rooms)}
                            </div>
                        </div>
                    </div>`;
            }).join('')
            : '<p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0.5rem 0;">Keine Veranstaltungen vorhanden.</p>';

        return `
            <div class="series-card card" data-series-id="${series.id}">
                <div class="series-card-header">
                    <div>
                        <div class="series-card-title">${escapeHTML(series.name)}</div>
                        <div class="series-card-subtitle">
                            <span class="material-icons-round">group</span>
                            ${studentCount} Studierende zugewiesen
                        </div>
                    </div>
                    <div class="series-card-actions">
                        <button class="btn btn-sm btn-outline btn-edit-series" data-series-id="${series.id}" type="button">
                            <span class="material-icons-round">edit</span> Bearbeiten
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-series" data-series-id="${series.id}" type="button">
                            <span class="material-icons-round">delete</span> Löschen
                        </button>
                    </div>
                </div>
                <div class="series-card-events">
                    ${eventsListHTML}
                </div>
            </div>`;
    }).join('');

    // -----------------------------------------------------------------
    // Full container HTML
    // -----------------------------------------------------------------
    container.innerHTML = `
        <!-- US12: Inline create form -->
        <div class="card" style="margin-bottom: 1.5rem;">
            <div class="card-header" style="margin-bottom: 1rem;">
                <h3>Neue Veranstaltungsreihe anlegen</h3>
            </div>
            <div class="inline-create-form">
                <div class="form-group">
                    <label for="new-series-name">Name der Reihe</label>
                    <input type="text" id="new-series-name" placeholder="z.\u00a0B. Datenbanken II" />
                </div>
                <button class="btn btn-sm btn-primary" id="btn-create-series" type="button">
                    <span class="material-icons-round">add</span> Anlegen
                </button>
            </div>
        </div>

        <!-- Series cards grid -->
        <div class="series-cards-grid">
            ${cardsHTML || '<div class="management-empty"><span class="material-icons-round">event_busy</span><p>Keine Veranstaltungsreihen vorhanden.</p></div>'}
        </div>

        <!-- US22: Auto room planning -->
        <div class="card" style="margin-top: 2rem;">
            <div class="card-header" style="margin-bottom: 1rem;">
                <h3>Automatische Raumplanung</h3>
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 1rem; font-size: 0.9rem;">
                Plant nicht zugewiesene Veranstaltungen automatisch in freie Räume und Zeitslots (Mo\u2013Fr, 09:00\u201317:00) ein.
            </p>
            <div class="inline-create-form">
                <div class="form-group">
                    <label for="auto-plan-start">Startdatum</label>
                    <input type="date" id="auto-plan-start" />
                </div>
                <div class="form-group">
                    <label for="auto-plan-end">Enddatum</label>
                    <input type="date" id="auto-plan-end" />
                </div>
                <button class="btn btn-sm btn-primary" id="btn-auto-plan" type="button">
                    <span class="material-icons-round">auto_fix_high</span> Planung starten
                </button>
            </div>
            <div id="auto-plan-result"></div>
        </div>
    `;

    // -----------------------------------------------------------------
    // Event listeners
    // -----------------------------------------------------------------

    // US12 – Create series
    const btnCreate = container.querySelector('#btn-create-series');
    const inputName = container.querySelector('#new-series-name');
    if (btnCreate && inputName) {
        btnCreate.addEventListener('click', () => {
            const name = inputName.value.trim();
            if (!name) return;
            const newSeries = {
                id: nextId(data.eventSeries),
                name,
                studentIds: [],
                events: []
            };
            data.eventSeries.push(newSeries);
            renderEventManagement(data);
        });
        inputName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') btnCreate.click();
        });
    }

    // US13 – Delete series
    container.querySelectorAll('.btn-delete-series').forEach(btn => {
        btn.addEventListener('click', () => {
            const seriesId = parseInt(btn.dataset.seriesId, 10);
            const series = data.eventSeries.find(s => s.id === seriesId);
            if (!series) return;
            showConfirmDialog(
                'Veranstaltungsreihe löschen',
                `Möchten Sie die Reihe "${escapeHTML(series.name)}" wirklich löschen? Alle zugehörigen Veranstaltungen werden ebenfalls entfernt.`,
                () => {
                    // Remove associated room bookings
                    series.events.forEach(ev => {
                        if (ev.roomId) {
                            const room = data.rooms.find(r => r.id === ev.roomId);
                            if (room) {
                                room.bookings = room.bookings.filter(
                                    b => !(b.eventSeriesId === seriesId && b.eventId === ev.id)
                                );
                            }
                        }
                    });
                    data.eventSeries = data.eventSeries.filter(s => s.id !== seriesId);
                    renderEventManagement(data);
                }
            );
        });
    });

    // Edit series buttons – open modal
    container.querySelectorAll('.btn-edit-series').forEach(btn => {
        btn.addEventListener('click', () => {
            const seriesId = parseInt(btn.dataset.seriesId, 10);
            openEditSeriesModal(data, seriesId);
        });
    });

    // US22 – Auto room planning
    const btnAutoPlan = container.querySelector('#btn-auto-plan');
    if (btnAutoPlan) {
        btnAutoPlan.addEventListener('click', () => {
            runAutoPlanning(data);
        });
    }
}

// =========================================================================
// Edit Series Modal (US14–US21)
// =========================================================================

/**
 * Opens the edit modal for a given event series.
 * @param {object} data - The global mockData object.
 * @param {number} seriesId - The ID of the series to edit.
 */
function openEditSeriesModal(data, seriesId) {
    const series = data.eventSeries.find(s => s.id === seriesId);
    if (!series) return;

    const bodyHTML = buildEditSeriesBody(data, series);
    const footerHTML = `<button class="btn btn-outline modal-close-action" type="button">Schließen</button>`;

    showModal(escapeHTML(series.name), bodyHTML, footerHTML, { sizeClass: 'modal-lg' });

    // Attach all event listeners inside the modal
    attachEditSeriesListeners(data, series);

    // Close button in footer
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = overlay.querySelector('.modal-close-action');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal();
            renderEventManagement(data);
        }, { once: true });
    }
}

/**
 * Builds the inner HTML for the edit-series modal body.
 * @param {object} data - The global mockData object.
 * @param {object} series - The event series being edited.
 * @returns {string} HTML string.
 */
function buildEditSeriesBody(data, series) {
    // ---- Student assignment (US14/US15) ----
    const allStudents = data.users.filter(u => u.role === 'student');
    const assignedStudents = allStudents.filter(s => series.studentIds.includes(s.id));
    const availableStudents = allStudents.filter(s => !series.studentIds.includes(s.id));

    const chipsHTML = assignedStudents.length > 0
        ? assignedStudents.map(s => `
            <span class="student-chip" data-student-id="${s.id}">
                ${escapeHTML(s.name)}
                <button class="btn-icon-only btn-remove-student" data-student-id="${s.id}" type="button" title="Entfernen">
                    <span class="material-icons-round">close</span>
                </button>
            </span>`).join('')
        : '<span style="color: var(--text-secondary); font-size: 0.875rem;">Keine Studierenden zugewiesen.</span>';

    const studentOptionsHTML = availableStudents.map(s =>
        `<option value="${s.id}">${escapeHTML(s.name)} (${escapeHTML(s.matriculationNumber || '')})</option>`
    ).join('');

    const studentSectionHTML = `
        <div style="margin-bottom: 1.5rem;">
            <h4 class="modal-section-heading">
                <span class="material-icons-round">people</span>
                Zugewiesene Studierende
            </h4>
            <div class="student-chips" id="modal-student-chips">
                ${chipsHTML}
            </div>
            ${availableStudents.length > 0 ? `
                <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; align-items: center; flex-wrap: wrap;">
                    <select id="modal-add-student-select" class="form-input" style="flex: 1; min-width: 180px;">
                        <option value="">-- Studierenden auswählen --</option>
                        ${studentOptionsHTML}
                    </select>
                    <button class="btn btn-sm btn-primary" id="modal-btn-add-student" type="button">
                        <span class="material-icons-round">person_add</span> Hinzufügen
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    // ---- Events list (US17–US21) ----
    const sortedEvents = [...series.events].sort((a, b) => a.order - b.order);

    const eventsHTML = sortedEvents.length > 0
        ? sortedEvents.map((ev, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === sortedEvents.length - 1;
            const typeBadgeClass = ev.type === 'Klausur' ? 'klausur' : 'lehrveranstaltung';

            // Room dropdown options
            const roomOptions = data.rooms.map(r =>
                `<option value="${r.id}" ${ev.roomId === r.id ? 'selected' : ''}>${escapeHTML(r.name)}</option>`
            ).join('');

            // Day dropdown options
            const dayOptions = DAY_NAMES.map((name, i) =>
                `<option value="${i}" ${ev.schedule && ev.schedule.day === i ? 'selected' : ''}>${escapeHTML(name)}</option>`
            ).join('');

            return `
                <div class="event-list-item" data-event-id="${ev.id}">
                    <div class="event-list-item-info">
                        <div class="event-list-item-header">
                            <span class="type-badge ${escapeHTML(typeBadgeClass)}">${escapeHTML(ev.type)}</span>
                            <span class="event-list-item-name">${escapeHTML(ev.name)}</span>
                        </div>
                        <div class="event-list-item-meta">
                            ${buildEventMeta(ev, data.rooms)}
                        </div>
                    </div>
                    <div class="event-list-item-actions">
                        <div class="action-group">
                            <button class="btn-icon-only btn-move-up" data-event-id="${ev.id}" ${isFirst ? 'disabled' : ''} type="button" title="Nach oben">
                                <span class="material-icons-round">arrow_upward</span>
                            </button>
                            <button class="btn-icon-only btn-move-down" data-event-id="${ev.id}" ${isLast ? 'disabled' : ''} type="button" title="Nach unten">
                                <span class="material-icons-round">arrow_downward</span>
                            </button>
                        </div>
                        <div class="action-group">
                            <button class="btn-icon-only btn-toggle-type" data-event-id="${ev.id}" type="button" title="Typ wechseln">
                                <span class="material-icons-round">swap_horiz</span>
                            </button>
                            <button class="btn-icon-only btn-edit-duration" data-event-id="${ev.id}" type="button" title="Dauer bearbeiten">
                                <span class="material-icons-round">timer</span>
                            </button>
                            <button class="btn-icon-only btn-edit-booking" data-event-id="${ev.id}" type="button" title="Buchung bearbeiten">
                                <span class="material-icons-round">event</span>
                            </button>
                        </div>
                        <div class="action-group">
                            <button class="btn-icon-only danger btn-remove-event" data-event-id="${ev.id}" type="button" title="Entfernen">
                                <span class="material-icons-round">delete</span>
                            </button>
                        </div>
                    </div>

                    <!-- Inline duration editor -->
                    <div class="inline-editor-wrapper" data-editor="duration" data-event-id="${ev.id}">
                        <div class="inline-editor-form">
                            <div class="form-group">
                                <label>Dauer (min)</label>
                                <input type="number" class="form-input duration-input" value="${ev.duration}" min="1" style="width: 100px;" />
                            </div>
                            <button class="btn btn-sm btn-primary btn-save-duration" data-event-id="${ev.id}" type="button">Speichern</button>
                            <button class="btn btn-sm btn-outline btn-cancel-duration" data-event-id="${ev.id}" type="button">Abbrechen</button>
                        </div>
                    </div>

                    <!-- Inline booking editor -->
                    <div class="inline-editor-wrapper" data-editor="booking" data-event-id="${ev.id}">
                        <div class="inline-editor-form">
                            <div class="form-group">
                                <label>Raum</label>
                                <select class="form-input booking-room" style="min-width: 120px;">
                                    <option value="">-- Raum --</option>
                                    ${roomOptions}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Tag</label>
                                <select class="form-input booking-day" style="min-width: 120px;">
                                    ${dayOptions}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Start</label>
                                <input type="time" class="form-input booking-start" value="${ev.schedule ? ev.schedule.start : '09:00'}" />
                            </div>
                            <div class="form-group">
                                <label>Ende</label>
                                <input type="time" class="form-input booking-end" value="${ev.schedule ? ev.schedule.end : '10:30'}" />
                            </div>
                            <button class="btn btn-sm btn-primary btn-save-booking" data-event-id="${ev.id}" type="button">Speichern</button>
                            <button class="btn btn-sm btn-outline btn-cancel-booking" data-event-id="${ev.id}" type="button">Abbrechen</button>
                        </div>
                    </div>
                </div>`;
        }).join('')
        : '<p style="color: var(--text-secondary); font-size: 0.875rem;">Keine Veranstaltungen vorhanden.</p>';

    // ---- Add event form (US16) ----
    const addEventHTML = `
        <div class="modal-section-divider">
            <h4 class="modal-section-heading">
                <span class="material-icons-round">add_circle_outline</span>
                Veranstaltung hinzufügen
            </h4>
            <div class="inline-editor-form">
                <div class="form-group" style="flex: 1; min-width: 160px;">
                    <label>Name</label>
                    <input type="text" id="modal-new-event-name" class="form-input" placeholder="z.\u00a0B. Vorlesung 1" />
                </div>
                <div class="form-group">
                    <label>Typ</label>
                    <select id="modal-new-event-type" class="form-input">
                        <option value="Lehrveranstaltung">Lehrveranstaltung</option>
                        <option value="Klausur">Klausur</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Dauer (min)</label>
                    <input type="number" id="modal-new-event-duration" class="form-input" value="90" min="1" style="width: 100px;" />
                </div>
                <button class="btn btn-sm btn-primary" id="modal-btn-add-event" type="button">
                    <span class="material-icons-round">add</span> Hinzufügen
                </button>
            </div>
        </div>
    `;

    return `
        ${studentSectionHTML}
        <div class="modal-section-divider">
            <h4 class="modal-section-heading">
                <span class="material-icons-round">event</span>
                Veranstaltungen
            </h4>
            <div id="modal-events-list">
                ${eventsHTML}
            </div>
            ${addEventHTML}
        </div>
    `;
}

/**
 * Attaches all interactive event listeners within the edit-series modal.
 * @param {object} data - The global mockData object.
 * @param {object} series - The event series being edited.
 */
function attachEditSeriesListeners(data, series) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    // --- US14: Add student ---
    const btnAddStudent = overlay.querySelector('#modal-btn-add-student');
    const selectStudent = overlay.querySelector('#modal-add-student-select');
    if (btnAddStudent && selectStudent) {
        btnAddStudent.addEventListener('click', () => {
            const studentId = parseInt(selectStudent.value, 10);
            if (!studentId) return;
            if (!series.studentIds.includes(studentId)) {
                series.studentIds.push(studentId);
            }
            refreshEditModal(data, series);
        });
    }

    // --- US15: Remove student ---
    overlay.querySelectorAll('.btn-remove-student').forEach(btn => {
        btn.addEventListener('click', () => {
            const studentId = parseInt(btn.dataset.studentId, 10);
            series.studentIds = series.studentIds.filter(id => id !== studentId);
            refreshEditModal(data, series);
        });
    });

    // --- US18: Move event up/down ---
    overlay.querySelectorAll('.btn-move-up').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = parseInt(btn.dataset.eventId, 10);
            moveEvent(series, eventId, -1);
            refreshEditModal(data, series);
        });
    });

    overlay.querySelectorAll('.btn-move-down').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = parseInt(btn.dataset.eventId, 10);
            moveEvent(series, eventId, 1);
            refreshEditModal(data, series);
        });
    });

    // --- US19: Toggle event type ---
    overlay.querySelectorAll('.btn-toggle-type').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = parseInt(btn.dataset.eventId, 10);
            const ev = series.events.find(e => e.id === eventId);
            if (ev) {
                ev.type = ev.type === 'Klausur' ? 'Lehrveranstaltung' : 'Klausur';
                refreshEditModal(data, series);
            }
        });
    });

    // --- US20: Edit duration (show/hide inline form) ---
    overlay.querySelectorAll('.btn-edit-duration').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = btn.dataset.eventId;
            const wrapper = overlay.querySelector(`.inline-editor-wrapper[data-editor="duration"][data-event-id="${eventId}"]`);
            if (wrapper) {
                wrapper.classList.toggle('open');
                // Close booking editor if open
                const bookingWrapper = overlay.querySelector(`.inline-editor-wrapper[data-editor="booking"][data-event-id="${eventId}"]`);
                if (bookingWrapper) bookingWrapper.classList.remove('open');
            }
        });
    });

    overlay.querySelectorAll('.btn-save-duration').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = parseInt(btn.dataset.eventId, 10);
            const wrapper = overlay.querySelector(`.inline-editor-wrapper[data-editor="duration"][data-event-id="${eventId}"]`);
            const input = wrapper ? wrapper.querySelector('.duration-input') : null;
            if (!input) return;
            const newDuration = parseInt(input.value, 10);
            if (Number.isNaN(newDuration) || newDuration < 1) return;
            const ev = series.events.find(e => e.id === eventId);
            if (ev) {
                ev.duration = newDuration;
                refreshEditModal(data, series);
            }
        });
    });

    overlay.querySelectorAll('.btn-cancel-duration').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = btn.dataset.eventId;
            const wrapper = overlay.querySelector(`.inline-editor-wrapper[data-editor="duration"][data-event-id="${eventId}"]`);
            if (wrapper) wrapper.classList.remove('open');
        });
    });

    // --- US21: Edit booking (show/hide inline form) ---
    overlay.querySelectorAll('.btn-edit-booking').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = btn.dataset.eventId;
            const wrapper = overlay.querySelector(`.inline-editor-wrapper[data-editor="booking"][data-event-id="${eventId}"]`);
            if (wrapper) {
                wrapper.classList.toggle('open');
                // Close duration editor if open
                const durationWrapper = overlay.querySelector(`.inline-editor-wrapper[data-editor="duration"][data-event-id="${eventId}"]`);
                if (durationWrapper) durationWrapper.classList.remove('open');
            }
        });
    });

    overlay.querySelectorAll('.btn-save-booking').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = parseInt(btn.dataset.eventId, 10);
            const wrapper = overlay.querySelector(`.inline-editor-wrapper[data-editor="booking"][data-event-id="${eventId}"]`);
            if (!wrapper) return;

            const roomId = parseInt(wrapper.querySelector('.booking-room').value, 10);
            const day = parseInt(wrapper.querySelector('.booking-day').value, 10);
            const start = wrapper.querySelector('.booking-start').value;
            const end = wrapper.querySelector('.booking-end').value;

            if (!roomId || Number.isNaN(day) || !start || !end) return;
            if (start >= end) return;

            const ev = series.events.find(e => e.id === eventId);
            if (!ev) return;

            // Remove old booking if it existed
            if (ev.roomId) {
                const oldRoom = data.rooms.find(r => r.id === ev.roomId);
                if (oldRoom) {
                    oldRoom.bookings = oldRoom.bookings.filter(
                        b => !(b.eventSeriesId === series.id && b.eventId === ev.id)
                    );
                }
            }

            // Set new schedule and room
            ev.schedule = { day, start, end };
            ev.roomId = roomId;

            // Add new booking to the room
            const room = data.rooms.find(r => r.id === roomId);
            if (room) {
                room.bookings.push({
                    day,
                    start,
                    end,
                    title: ev.name,
                    eventSeriesId: series.id,
                    eventId: ev.id
                });
            }

            refreshEditModal(data, series);
        });
    });

    overlay.querySelectorAll('.btn-cancel-booking').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = btn.dataset.eventId;
            const wrapper = overlay.querySelector(`.inline-editor-wrapper[data-editor="booking"][data-event-id="${eventId}"]`);
            if (wrapper) wrapper.classList.remove('open');
        });
    });

    // --- US17: Remove event ---
    overlay.querySelectorAll('.btn-remove-event').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = parseInt(btn.dataset.eventId, 10);
            const ev = series.events.find(e => e.id === eventId);
            if (!ev) return;

            // Remove associated room booking
            if (ev.roomId) {
                const room = data.rooms.find(r => r.id === ev.roomId);
                if (room) {
                    room.bookings = room.bookings.filter(
                        b => !(b.eventSeriesId === series.id && b.eventId === ev.id)
                    );
                }
            }

            series.events = series.events.filter(e => e.id !== eventId);

            // Renumber remaining event orders
            const sorted = [...series.events].sort((a, b) => a.order - b.order);
            sorted.forEach((e, i) => { e.order = i + 1; });

            refreshEditModal(data, series);
        });
    });

    // --- US16: Add event ---
    const btnAddEvent = overlay.querySelector('#modal-btn-add-event');
    if (btnAddEvent) {
        btnAddEvent.addEventListener('click', () => {
            const nameInput = overlay.querySelector('#modal-new-event-name');
            const typeSelect = overlay.querySelector('#modal-new-event-type');
            const durationInput = overlay.querySelector('#modal-new-event-duration');

            const name = nameInput ? nameInput.value.trim() : '';
            const type = typeSelect ? typeSelect.value : 'Lehrveranstaltung';
            const duration = durationInput ? parseInt(durationInput.value, 10) : 90;

            if (!name) return;
            if (Number.isNaN(duration) || duration < 1) return;

            const maxOrder = series.events.length > 0
                ? Math.max(...series.events.map(e => e.order))
                : 0;

            series.events.push({
                id: nextId(series.events),
                name,
                type,
                duration,
                schedule: null,
                roomId: null,
                order: maxOrder + 1
            });

            refreshEditModal(data, series);
        });
    }
}

/**
 * Refreshes the edit modal content without closing it.
 * @param {object} data - The global mockData object.
 * @param {object} series - The event series being edited.
 */
function refreshEditModal(data, series) {
    const bodyEl = document.getElementById('modal-body');
    if (!bodyEl) return;
    bodyEl.innerHTML = buildEditSeriesBody(data, series);
    attachEditSeriesListeners(data, series);
}

/**
 * Moves an event up or down in the ordering.
 * @param {object} series - The event series.
 * @param {number} eventId - The ID of the event to move.
 * @param {number} direction - -1 for up, +1 for down.
 */
function moveEvent(series, eventId, direction) {
    const sorted = [...series.events].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(e => e.id === eventId);
    if (idx < 0) return;

    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    // Swap order values
    const tempOrder = sorted[idx].order;
    sorted[idx].order = sorted[swapIdx].order;
    sorted[swapIdx].order = tempOrder;
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
function runAutoPlanning(data) {
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
                Kein freier Slot gefunden für: ${errors.map(n => escapeHTML(n)).join(', ')}
            </div>`;
    }

    resultDiv.innerHTML = messageHTML;

    // Re-render cards view
    renderEventManagement(data);
}
