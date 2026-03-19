import { escapeHTML } from '../../../core/utils.js';
import { showConfirmDialog } from '../../../core/modal.js';
import { openEditSeriesModal } from './editSeriesModal.js';
import { runAutoPlanning } from './autoPlanning.js';
import { DAY_NAMES, DAY_SHORT } from '../../shared/constants.js';

function getRoomName(rooms, roomId) {
    if (roomId == null) return '-';
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : '-';
}

function formatSchedule(schedule) {
    if (!schedule) return 'Nicht geplant';
    return `${DAY_SHORT[schedule.day]} ${schedule.start}\u2013${schedule.end}`;
}

function buildEventMeta(ev, rooms) {
    const durationHTML = `<span class="meta-item">
        <span class="material-symbols-rounded">timer</span>${ev.duration} min
    </span>`;

    const scheduleHTML = ev.schedule
        ? `<span class="meta-item">
            <span class="material-symbols-rounded">schedule</span>${DAY_SHORT[ev.schedule.day]} ${ev.schedule.start}\u2013${ev.schedule.end}
          </span>`
        : `<span class="meta-item unplanned">
            <span class="material-symbols-rounded">event_busy</span>Nicht geplant
          </span>`;

    const roomName = getRoomName(rooms, ev.roomId);
    const roomHTML = ev.roomId != null
        ? `<span class="meta-item">
            <span class="material-symbols-rounded">meeting_room</span>${escapeHTML(roomName)}
          </span>`
        : `<span class="meta-item unplanned">
            <span class="material-symbols-rounded">meeting_room</span>Kein Raum
          </span>`;

    return `${durationHTML}${scheduleHTML}${roomHTML}`;
}

function nextId(items) {
    if (!items || items.length === 0) return 1;
    return Math.max(...items.map(i => i.id)) + 1;
}

const EVENT_TEMPLATES = [
    {
        id: 'vorlesung',
        label: 'Vorlesungstemplate',
        events: [
            { name: 'Vorlesung', type: 'Lehrveranstaltung', duration: 90 },
            { name: 'Übung', type: 'Lehrveranstaltung', duration: 45 },
            { name: 'Klausur', type: 'Klausur', duration: 120 }
        ]
    },
    {
        id: 'seminar',
        label: 'Seminartemplate',
        events: [
            { name: 'Seminar', type: 'Lehrveranstaltung', duration: 90 },
            { name: 'Abschlusspräsentation', type: 'Lehrveranstaltung', duration: 60 }
        ]
    },
    {
        id: 'praxis',
        label: 'Praxismodultemplate',
        events: [
            { name: 'Praxisveranstaltung', type: 'Lehrveranstaltung', duration: 120 },
            { name: 'Betreuungsgespräch', type: 'Lehrveranstaltung', duration: 30 },
            { name: 'Abgabe / Präsentation', type: 'Klausur', duration: 60 }
        ]
    }
];

export function renderEventManagement(data) {
    const container = document.querySelector('.admin-events-content');
    if (!container) return;

    const seriesSorted = [...data.eventSeries].sort((a, b) =>
        a.name.localeCompare(b.name, 'de')
    );

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
                            <span class="material-symbols-rounded">group</span>
                            ${studentCount} Studierende zugewiesen
                        </div>
                    </div>
                    <div class="series-card-actions">
                        <button class="btn btn-sm btn-outline btn-edit-series" data-series-id="${series.id}" type="button">
                            <span class="material-symbols-rounded">edit</span> Bearbeiten
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-series" data-series-id="${series.id}" type="button">
                            <span class="material-symbols-rounded">delete</span> L\u00f6schen
                        </button>
                    </div>
                </div>
                <div class="series-card-events">
                    ${eventsListHTML}
                </div>
            </div>`;
    }).join('');

    container.innerHTML = `
        <div class="card mgmt-form-section">
            <div class="card-header mgmt-card-header">
                <h3>Neue Veranstaltungsreihe anlegen</h3>
            </div>
            <div class="inline-create-form" style="flex-wrap:wrap;gap:0.75rem;">
                <div class="form-group" style="flex:2;min-width:180px;">
                    <label for="new-series-name">Name der Reihe</label>
                    <input type="text" id="new-series-name" placeholder="z.\u00a0B. Datenbanken II" />
                </div>
                <div class="form-group" style="flex:1;min-width:160px;">
                    <label for="new-series-template">Vorlage verwenden</label>
                    <select id="new-series-template">
                        <option value="">— Keine Vorlage —</option>
                        ${EVENT_TEMPLATES.map(t =>
                            `<option value="${t.id}">${escapeHTML(t.label)}</option>`
                        ).join('')}
                    </select>
                </div>
                <button class="btn btn-sm btn-primary" id="btn-create-series" type="button"
                        style="align-self:flex-end;">
                    <span class="material-symbols-rounded">add</span> Anlegen
                </button>
            </div>
            <div id="template-preview" style="margin-top:0.5rem;display:none;">
                <p class="mgmt-desc-text" style="margin:0 0 0.25rem;">
                    <strong>Vorlage enthält:</strong>
                </p>
                <div id="template-preview-items" style="display:flex;gap:0.5rem;flex-wrap:wrap;"></div>
            </div>
        </div>

        <div class="series-cards-grid">
            ${cardsHTML || '<div class="management-empty"><span class="material-symbols-rounded">event_busy</span><p>Keine Veranstaltungsreihen vorhanden.</p></div>'}
        </div>

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
                    <span class="material-symbols-rounded">auto_fix_high</span> Planung starten
                </button>
            </div>
            <div id="auto-plan-result"></div>
        </div>
    `;

    const btnCreate = container.querySelector('#btn-create-series');
    const inputName = container.querySelector('#new-series-name');
    const templateSelect = container.querySelector('#new-series-template');
    const templatePreview = container.querySelector('#template-preview');
    const templatePreviewItems = container.querySelector('#template-preview-items');

    if (templateSelect && templatePreview && templatePreviewItems) {
        templateSelect.addEventListener('change', () => {
            const tpl = EVENT_TEMPLATES.find(t => t.id === templateSelect.value);
            if (tpl) {
                templatePreviewItems.innerHTML = tpl.events.map(ev =>
                    `<span class="type-badge ${ev.type === 'Klausur' ? 'klausur' : 'lehrveranstaltung'}">
                        ${escapeHTML(ev.name)} (${ev.duration} min)
                    </span>`
                ).join('');
                templatePreview.style.display = '';
                // Pre-fill name if empty
                if (inputName && !inputName.value.trim()) {
                    inputName.value = tpl.label.replace('template', '').trim();
                }
            } else {
                templatePreview.style.display = 'none';
            }
        });
    }

    if (btnCreate && inputName) {
        btnCreate.addEventListener('click', () => {
            const name = inputName.value.trim();
            if (!name) return;

            const selectedTemplate = templateSelect ? EVENT_TEMPLATES.find(t => t.id === templateSelect.value) : null;
            const events = selectedTemplate
                ? selectedTemplate.events.map((ev, i) => ({
                    id: i + 1,
                    name: ev.name,
                    type: ev.type,
                    duration: ev.duration,
                    schedule: null,
                    roomId: null,
                    order: i + 1
                }))
                : [];

            const newSeries = {
                id: nextId(data.eventSeries),
                name,
                studentIds: [],
                events
            };
            data.eventSeries.push(newSeries);
            renderEventManagement(data);
        });
        inputName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') btnCreate.click();
        });
    }

    container.querySelectorAll('.btn-delete-series').forEach(btn => {
        btn.addEventListener('click', () => {
            const seriesId = parseInt(btn.dataset.seriesId, 10);
            const series = data.eventSeries.find(s => s.id === seriesId);
            if (!series) return;
            showConfirmDialog(
                'Veranstaltungsreihe l\u00f6schen',
                `M\u00f6chten Sie die Reihe "${escapeHTML(series.name)}" wirklich l\u00f6schen? Alle zugeh\u00f6rigen Veranstaltungen werden ebenfalls entfernt.`,
                () => {
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

    container.querySelectorAll('.btn-edit-series').forEach(btn => {
        btn.addEventListener('click', () => {
            const seriesId = parseInt(btn.dataset.seriesId, 10);
            openEditSeriesModal(data, seriesId);
        });
    });

    const btnAutoPlan = container.querySelector('#btn-auto-plan');
    if (btnAutoPlan) {
        btnAutoPlan.addEventListener('click', () => {
            runAutoPlanning(data);
        });
    }
}

export { DAY_NAMES, DAY_SHORT } from '../../shared/constants.js';
export { buildEventMeta, nextId };
