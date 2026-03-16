import { escapeHTML } from '../../../core/utils.js';
import { showModal, closeModal } from '../../../core/modal.js';
import { renderEventManagement, DAY_NAMES, buildEventMeta, nextId } from './seriesCards.js';

export function openEditSeriesModal(data, seriesId) {
    const series = data.eventSeries.find(s => s.id === seriesId);
    if (!series) return;

    const bodyHTML = buildEditSeriesBody(data, series);
    const footerHTML = `<button class="btn btn-outline modal-close-action" type="button">Schlie\u00dfen</button>`;

    showModal(escapeHTML(series.name), bodyHTML, footerHTML, { sizeClass: 'modal-lg' });

    attachEditSeriesListeners(data, series);

    const overlay = document.getElementById('modal-overlay');
    const closeBtn = overlay.querySelector('.modal-close-action');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal();
            renderEventManagement(data);
        }, { once: true });
    }
}

function buildEditSeriesBody(data, series) {
    const allStudents = data.users.filter(u => u.role === 'student');
    const assignedStudents = allStudents.filter(s => series.studentIds.includes(s.id));
    const availableStudents = allStudents.filter(s => !series.studentIds.includes(s.id));

    const chipsHTML = assignedStudents.length > 0
        ? assignedStudents.map(s => `
            <span class="student-chip" data-student-id="${s.id}">
                ${escapeHTML(s.name)}
                <button class="btn-icon-only btn-remove-student" data-student-id="${s.id}" type="button" title="Entfernen">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </span>`).join('')
        : '<span style="color: var(--text-secondary); font-size: 0.875rem;">Keine Studierenden zugewiesen.</span>';

    const studentOptionsHTML = availableStudents.map(s =>
        `<option value="${s.id}">${escapeHTML(s.name)} (${escapeHTML(s.matriculationNumber || '')})</option>`
    ).join('');

    const studentSectionHTML = `
        <div style="margin-bottom: 1.5rem;">
            <h4 class="modal-section-heading">
                <span class="material-symbols-rounded">people</span>
                Zugewiesene Studierende
            </h4>
            <div class="student-chips" id="modal-student-chips">
                ${chipsHTML}
            </div>
            ${availableStudents.length > 0 ? `
                <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; align-items: center; flex-wrap: wrap;">
                    <select id="modal-add-student-select" class="form-input" style="flex: 1; min-width: 180px;">
                        <option value="">-- Studierenden ausw\u00e4hlen --</option>
                        ${studentOptionsHTML}
                    </select>
                    <button class="btn btn-sm btn-primary" id="modal-btn-add-student" type="button">
                        <span class="material-symbols-rounded">person_add</span> Hinzuf\u00fcgen
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    const sortedEvents = [...series.events].sort((a, b) => a.order - b.order);

    const eventsHTML = sortedEvents.length > 0
        ? sortedEvents.map((ev, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === sortedEvents.length - 1;
            const typeBadgeClass = ev.type === 'Klausur' ? 'klausur' : 'lehrveranstaltung';

            const roomOptions = data.rooms.map(r =>
                `<option value="${r.id}" ${ev.roomId === r.id ? 'selected' : ''}>${escapeHTML(r.name)}</option>`
            ).join('');

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
                                <span class="material-symbols-rounded">arrow_upward</span>
                            </button>
                            <button class="btn-icon-only btn-move-down" data-event-id="${ev.id}" ${isLast ? 'disabled' : ''} type="button" title="Nach unten">
                                <span class="material-symbols-rounded">arrow_downward</span>
                            </button>
                        </div>
                        <div class="action-group">
                            <button class="btn-icon-only btn-toggle-type" data-event-id="${ev.id}" type="button" title="Typ wechseln">
                                <span class="material-symbols-rounded">swap_horiz</span>
                            </button>
                            <button class="btn-icon-only btn-edit-duration" data-event-id="${ev.id}" type="button" title="Dauer bearbeiten">
                                <span class="material-symbols-rounded">timer</span>
                            </button>
                            <button class="btn-icon-only btn-edit-booking" data-event-id="${ev.id}" type="button" title="Buchung bearbeiten">
                                <span class="material-symbols-rounded">event</span>
                            </button>
                        </div>
                        <div class="action-group">
                            <button class="btn-icon-only danger btn-remove-event" data-event-id="${ev.id}" type="button" title="Entfernen">
                                <span class="material-symbols-rounded">delete</span>
                            </button>
                        </div>
                    </div>

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

    const addEventHTML = `
        <div class="modal-section-divider">
            <h4 class="modal-section-heading">
                <span class="material-symbols-rounded">add_circle_outline</span>
                Veranstaltung hinzuf\u00fcgen
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
                    <span class="material-symbols-rounded">add</span> Hinzuf\u00fcgen
                </button>
            </div>
        </div>
    `;

    return `
        ${studentSectionHTML}
        <div class="modal-section-divider">
            <h4 class="modal-section-heading">
                <span class="material-symbols-rounded">event</span>
                Veranstaltungen
            </h4>
            <div id="modal-events-list">
                ${eventsHTML}
            </div>
            ${addEventHTML}
        </div>
    `;
}

function attachEditSeriesListeners(data, series) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

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

    overlay.querySelectorAll('.btn-remove-student').forEach(btn => {
        btn.addEventListener('click', () => {
            const studentId = parseInt(btn.dataset.studentId, 10);
            series.studentIds = series.studentIds.filter(id => id !== studentId);
            refreshEditModal(data, series);
        });
    });

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

    overlay.querySelectorAll('.btn-edit-duration').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = btn.dataset.eventId;
            const wrapper = overlay.querySelector(`.inline-editor-wrapper[data-editor="duration"][data-event-id="${eventId}"]`);
            if (wrapper) {
                wrapper.classList.toggle('open');
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

    overlay.querySelectorAll('.btn-edit-booking').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = btn.dataset.eventId;
            const wrapper = overlay.querySelector(`.inline-editor-wrapper[data-editor="booking"][data-event-id="${eventId}"]`);
            if (wrapper) {
                wrapper.classList.toggle('open');
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

            if (ev.roomId) {
                const oldRoom = data.rooms.find(r => r.id === ev.roomId);
                if (oldRoom) {
                    oldRoom.bookings = oldRoom.bookings.filter(
                        b => !(b.eventSeriesId === series.id && b.eventId === ev.id)
                    );
                }
            }

            ev.schedule = { day, start, end };
            ev.roomId = roomId;

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

    overlay.querySelectorAll('.btn-remove-event').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = parseInt(btn.dataset.eventId, 10);
            const ev = series.events.find(e => e.id === eventId);
            if (!ev) return;

            if (ev.roomId) {
                const room = data.rooms.find(r => r.id === ev.roomId);
                if (room) {
                    room.bookings = room.bookings.filter(
                        b => !(b.eventSeriesId === series.id && b.eventId === ev.id)
                    );
                }
            }

            series.events = series.events.filter(e => e.id !== eventId);

            const sorted = [...series.events].sort((a, b) => a.order - b.order);
            sorted.forEach((e, i) => { e.order = i + 1; });

            refreshEditModal(data, series);
        });
    });

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

function refreshEditModal(data, series) {
    const bodyEl = document.getElementById('modal-body');
    if (!bodyEl) return;
    bodyEl.innerHTML = buildEditSeriesBody(data, series);
    attachEditSeriesListeners(data, series);
}

function moveEvent(series, eventId, direction) {
    const sorted = [...series.events].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(e => e.id === eventId);
    if (idx < 0) return;

    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const tempOrder = sorted[idx].order;
    sorted[idx].order = sorted[swapIdx].order;
    sorted[swapIdx].order = tempOrder;
}
