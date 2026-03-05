import { escapeHTML } from '../../../core/utils.js';
import { showConfirmDialog } from '../../../core/modal.js';
import { openEditSeriesModal } from './editSeriesModal.js';
import { runAutoPlanning } from './autoPlanning.js';

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
                            <span class="material-icons-round">delete</span> L\u00f6schen
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
        <div class="card mgmt-form-section">
            <div class="card-header mgmt-card-header">
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
            <div class="card-header mgmt-card-header">
                <h3>Automatische Raumplanung</h3>
            </div>
            <p class="mgmt-desc-text">
                Plant nicht zugewiesene Veranstaltungen automatisch in freie R\u00e4ume und Zeitslots (Mo\u2013Fr, 09:00\u201317:00) ein.
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
                'Veranstaltungsreihe l\u00f6schen',
                `M\u00f6chten Sie die Reihe "${escapeHTML(series.name)}" wirklich l\u00f6schen? Alle zugeh\u00f6rigen Veranstaltungen werden ebenfalls entfernt.`,
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

export { DAY_NAMES, DAY_SHORT, buildEventMeta, nextId };
