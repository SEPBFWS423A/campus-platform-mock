import { escapeHTML } from '../../../core/utils.js';

const DAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
const DAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

function timesOverlap(a1, a2, b1, b2) {
    return a1 < b2 && b1 < a2;
}

function addMinutes(timeStr, minutes) {
    const [h, m] = timeStr.split(':').map(Number);
    const total = h * 60 + m + minutes;
    if (total > 24 * 60) return null;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function getRoomCapacity(room, isExam) {
    if (isExam && room.examSeats != null && room.examSeats > 0) return room.examSeats;
    return room.seats || 0;
}

function findRoom(data, series, ev, day, start, end, tempBookings, capacityAware) {
    const isExam = ev.type === 'Klausur';
    const needed = capacityAware
        ? (Array.isArray(series.studentIds) ? series.studentIds.length : 0)
        : 0;

    const candidates = data.rooms
        .filter(r => !capacityAware || getRoomCapacity(r, isExam) >= Math.max(needed, 1))
        .sort((a, b) => getRoomCapacity(a, isExam) - getRoomCapacity(b, isExam));

    for (const room of candidates) {
        const existingConflict = room.bookings.some(b =>
            b.day === day && timesOverlap(b.start, b.end, start, end)
        );
        if (existingConflict) continue;

        const tempConflict = (tempBookings[room.id] || []).some(b =>
            b.day === day && timesOverlap(b.start, b.end, start, end)
        );
        if (tempConflict) continue;

        return room;
    }
    return null;
}

/**
 * Plans unscheduled events intelligently.
 * Returns an HTML string for the result area (does NOT manipulate DOM).
 */
export function runAutoPlanning(data) {
    const examDaysPref = document.getElementById('plan-opt-exam-days')?.checked !== false;
    const capacityAware = document.getElementById('plan-opt-capacity')?.checked !== false;

    const START_HOUR = 8;
    const END_HOUR = 18;

    // Collect unscheduled events – Lehrveranstaltungen first, then Klausuren
    const unscheduled = [];
    data.eventSeries.forEach(series => {
        series.events
            .filter(ev => ev.type !== 'Klausur' && (!ev.schedule || !ev.roomId))
            .forEach(ev => unscheduled.push({ series, ev }));
        series.events
            .filter(ev => ev.type === 'Klausur' && (!ev.schedule || !ev.roomId))
            .forEach(ev => unscheduled.push({ series, ev }));
    });

    if (unscheduled.length === 0) {
        return `<div class="management-alert success">
            <span class="material-symbols-rounded">check_circle</span>
            Alle Veranstaltungen sind bereits vollständig eingeplant.
        </div>`;
    }

    // Day order preferences
    const LECTURE_DAYS = [0, 1, 2, 3, 4]; // Mon → Fri
    const EXAM_DAYS    = [3, 4, 2, 1, 0]; // Thu, Fri, Wed, Tue, Mon

    // Track newly assigned slots within this run to avoid self-conflicts
    const tempBookings = {};

    const results = [];

    for (const { series, ev } of unscheduled) {
        const isExam = ev.type === 'Klausur';
        const days = (isExam && examDaysPref) ? EXAM_DAYS : LECTURE_DAYS;
        const duration = ev.duration || 90;

        let placed = false;

        outer:
        for (const day of days) {
            for (let h = START_HOUR; h < END_HOUR; h++) {
                for (let m = 0; m < 60; m += 15) {
                    const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                    const end = addMinutes(start, duration);
                    if (!end) continue;
                    const [endH] = end.split(':').map(Number);
                    if (endH > END_HOUR || (endH === END_HOUR && end.split(':')[1] !== '00')) continue;

                    const room = findRoom(data, series, ev, day, start, end, tempBookings, capacityAware);
                    if (room) {
                        ev.schedule = { day, start, end };
                        ev.roomId = room.id;

                        if (!tempBookings[room.id]) tempBookings[room.id] = [];
                        tempBookings[room.id].push({ day, start, end });

                        room.bookings.push({
                            day, start, end,
                            title: ev.name,
                            eventSeriesId: series.id,
                            eventId: ev.id
                        });

                        results.push({ ev, series, room, success: true });
                        placed = true;
                        break outer;
                    }
                }
            }
        }

        if (!placed) {
            results.push({ ev, series, success: false });
        }
    }

    // Group by series
    const bySeries = {};
    results.forEach(r => {
        const key = r.series.id;
        if (!bySeries[key]) bySeries[key] = { series: r.series, items: [] };
        bySeries[key].items.push(r);
    });

    const successCount = results.filter(r => r.success).length;
    const failCount    = results.filter(r => !r.success).length;

    const detailRows = Object.values(bySeries).map(({ series, items }) => {
        const itemsHTML = items.map(r => `
            <div class="plan-result-item ${r.success ? 'success' : 'error'}">
                <span class="material-symbols-rounded">${r.success ? 'check_circle' : 'warning'}</span>
                <span class="plan-result-name">${escapeHTML(r.ev.name)}</span>
                ${r.success
                    ? `<span class="plan-result-detail">${DAY_SHORT[r.ev.schedule.day]} ${r.ev.schedule.start}–${r.ev.schedule.end} &middot; ${escapeHTML(r.room.name)}</span>`
                    : `<span class="plan-result-detail plan-result-detail--error">Kein passender Raum verfügbar</span>`
                }
            </div>`).join('');

        return `
            <div class="plan-result-series">
                <div class="plan-result-series-name">
                    <span class="material-symbols-rounded">event_note</span>
                    ${escapeHTML(series.name)}
                </div>
                ${itemsHTML}
            </div>`;
    }).join('');

    const alertClass = failCount === 0 ? 'success' : successCount > 0 ? 'info' : 'error';
    const alertIcon  = failCount === 0 ? 'check_circle' : successCount > 0 ? 'info' : 'error';
    const alertMsg   = failCount === 0
        ? `${successCount} Veranstaltung${successCount !== 1 ? 'en' : ''} erfolgreich eingeplant.`
        : `${successCount} eingeplant · ${failCount} ohne passenden Raum${capacityAware ? ' (Raumkapazität prüfen)' : ''}.`;

    return `
        <div class="management-alert ${alertClass}">
            <span class="material-symbols-rounded">${alertIcon}</span>
            ${alertMsg}
        </div>
        <div class="plan-results-detail">${detailRows}</div>`;
}
