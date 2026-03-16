import { timeToMinutes } from '../../../core/utils.js';
import { renderRoomList } from './roomList.js';
import { renderRoomSchedule } from './roomSchedule.js';
import { renderRoomUtilization } from './roomUtilization.js';
import { initTabs } from '../../shared/tabSwitching.js';
import { buildStatCard } from '../../shared/uiComponents.js';

export const AVAILABLE_HOURS_PER_DAY = 9;

export function renderRoomManagement(data) {
    const container = document.querySelector('.admin-rooms-content');
    if (!container) return;

    const rooms = data.rooms;
    const totalSeats = rooms.reduce((sum, r) => sum + (r.seats || 0), 0);

    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffMon);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const dayOcc = countDayOccurrences(monday, friday);
    const weekdays = countWeekdays(monday, friday);
    const totalAvailable = rooms.length * weekdays * AVAILABLE_HOURS_PER_DAY;
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
        <div class="grid-container stats-row room-stats-row">
            ${buildStatCard({ label: 'R\u00e4ume gesamt', value: rooms.length, icon: 'meeting_room', colorClass: 'primary-bg' })}
            ${buildStatCard({ label: 'Sitzpl\u00e4tze gesamt', value: totalSeats, icon: 'event_seat', colorClass: 'success-bg' })}
            ${buildStatCard({ label: 'Gesamtauslastung', value: `${overallUtil}%`, icon: 'speed', colorClass: 'warning-bg' })}
        </div>

        <div class="management-tabs">
            <button class="management-tab active" data-tab="room-list">
                <span class="material-symbols-rounded">list</span> Raumliste
            </button>
            <button class="management-tab" data-tab="room-schedule">
                <span class="material-symbols-rounded">calendar_month</span> Belegungsplan
            </button>
            <button class="management-tab" data-tab="room-utilization">
                <span class="material-symbols-rounded">bar_chart</span> Auslastung
            </button>
        </div>

        <div id="room-list" class="management-tab-content active"></div>
        <div id="room-schedule" class="management-tab-content"></div>
        <div id="room-utilization" class="management-tab-content"></div>
    `;

    initTabs(container, { tabSelector: '.management-tab', panelSelector: '.management-tab-content' });
    renderRoomList(data);
    renderRoomSchedule(data);
    renderRoomUtilization(data);
}

export function countWeekdays(start, end) {
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

export function countDayOccurrences(start, end) {
    const counts = [0, 0, 0, 0, 0];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endNorm = new Date(end);
    endNorm.setHours(0, 0, 0, 0);

    while (current <= endNorm) {
        const dow = current.getDay();
        if (dow >= 1 && dow <= 5) {
            counts[dow - 1]++;
        }
        current.setDate(current.getDate() + 1);
    }
    return counts;
}
