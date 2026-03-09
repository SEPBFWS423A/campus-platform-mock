import { timeToMinutes } from '../../../core/utils.js';
import { renderRoomList } from './roomList.js';
import { renderRoomSchedule } from './roomSchedule.js';
import { renderRoomUtilization } from './roomUtilization.js';

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
