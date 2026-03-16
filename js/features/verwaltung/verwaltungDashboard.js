import { escapeHTML, formatDateDE } from '../../core/utils.js';
import { buildStatCard, bindActionButtons } from '../shared/uiComponents.js';

export function renderVerwaltungDashboard(data, user, navigation) {
    const totalUsers = data.users.length;
    const totalRooms = (data.rooms || []).length;
    const totalSeries = (data.eventSeries || []).length;

    const students = data.users.filter(u => u.role === 'student');
    const dozenten = data.users.filter(u => u.role === 'dozent');
    const verwaltungUsers = data.users.filter(u => u.role === 'verwaltung');

    const examResultsObj = data.examResults || {};
    let totalExamResults = 0;
    Object.values(examResultsObj).forEach(results => {
        totalExamResults += results.length;
    });
    const examResultKeys = Object.keys(examResultsObj).length;

    const roomsWithBookings = (data.rooms || []).filter(r => r.bookings && r.bookings.length > 0);
    const totalBookings = (data.rooms || []).reduce((sum, r) => sum + (r.bookings ? r.bookings.length : 0), 0);
    const totalSeats = (data.rooms || []).reduce((sum, r) => sum + (r.seats || 0), 0);

    const totalEvents = (data.eventSeries || []).reduce((sum, es) => sum + (es.events ? es.events.length : 0), 0);

    const statsContainer = document.querySelector('.stats-row');
    if (statsContainer) {
        statsContainer.classList.add('stats-row-4');
        statsContainer.innerHTML = [
            buildStatCard({ label: 'Benutzer gesamt', value: totalUsers, icon: 'people', colorClass: 'primary-bg', desc: `${students.length} Stud. \u2022 ${dozenten.length} Doz. \u2022 ${verwaltungUsers.length} Verw.` }),
            buildStatCard({ label: 'R\u00e4ume', value: totalRooms, icon: 'meeting_room', colorClass: 'warning-bg', desc: `${roomsWithBookings.length} belegt \u2022 ${totalRooms - roomsWithBookings.length} frei` }),
            buildStatCard({ label: 'Veranstaltungsreihen', value: totalSeries, icon: 'event', colorClass: 'success-bg', desc: `${totalEvents} Events insgesamt` }),
            buildStatCard({ label: 'Pr\u00fcfungsergebnisse', value: totalExamResults, icon: 'assessment', colorClass: 'secondary-bg', desc: `${examResultKeys} Pr\u00fcfungen bewertet` })
        ].join('');
    }

    const scheduleCardHeader = document.querySelector('.schedule-card .card-header h3');
    if (scheduleCardHeader) {
        scheduleCardHeader.textContent = 'System\u00fcbersicht';
    }

    const viewAllBtn = document.getElementById('view-all-schedule');
    if (viewAllBtn) {
        viewAllBtn.classList.add('mgmt-hidden');
    }

    const timelineContainer = document.querySelector('.timeline');
    if (timelineContainer) {
        timelineContainer.className = 'admin-overview';

        const studentPct = totalUsers > 0 ? Math.round((students.length / totalUsers) * 100) : 0;
        const dozentPct = totalUsers > 0 ? Math.round((dozenten.length / totalUsers) * 100) : 0;
        const verwaltungPct = totalUsers > 0 ? Math.round((verwaltungUsers.length / totalUsers) * 100) : 0;
        const roomUtilPct = totalRooms > 0 ? Math.round((roomsWithBookings.length / totalRooms) * 100) : 0;

        timelineContainer.innerHTML = `
            <div class="admin-overview-section">
                <h4 class="admin-overview-heading">
                    <span class="material-symbols-rounded">group</span>
                    Benutzer nach Rolle
                </h4>
                <div class="admin-overview-bars">
                    <div class="admin-bar-item">
                        <div class="admin-bar-label">
                            <span>Studierende</span>
                            <span class="admin-bar-value">${students.length} (${studentPct}%)</span>
                        </div>
                        <div class="progress-bar"><div class="progress-fill progress-primary" style="width: ${studentPct}%;"></div></div>
                    </div>
                    <div class="admin-bar-item">
                        <div class="admin-bar-label">
                            <span>Dozenten</span>
                            <span class="admin-bar-value">${dozenten.length} (${dozentPct}%)</span>
                        </div>
                        <div class="progress-bar"><div class="progress-fill progress-warning" style="width: ${dozentPct}%;"></div></div>
                    </div>
                    <div class="admin-bar-item">
                        <div class="admin-bar-label">
                            <span>Verwaltung</span>
                            <span class="admin-bar-value">${verwaltungUsers.length} (${verwaltungPct}%)</span>
                        </div>
                        <div class="progress-bar"><div class="progress-fill" style="width: ${verwaltungPct}%;"></div></div>
                    </div>
                </div>
            </div>

            <hr class="admin-overview-divider">

            <div class="admin-overview-section">
                <h4 class="admin-overview-heading">
                    <span class="material-symbols-rounded">meeting_room</span>
                    Raumauslastung
                </h4>
                <div class="admin-bar-item">
                    <div class="admin-bar-label">
                        <span>Belegte R\u00e4ume</span>
                        <span class="admin-bar-value">${roomsWithBookings.length} / ${totalRooms} (${roomUtilPct}%)</span>
                    </div>
                    <div class="progress-bar"><div class="progress-fill" style="width: ${roomUtilPct}%;"></div></div>
                </div>
                <div class="admin-mini-stats">
                    <div class="admin-mini-stat">
                        <div class="admin-mini-stat-value">${totalBookings}</div>
                        <div class="admin-mini-stat-label">Aktive Buchungen</div>
                    </div>
                    <div class="admin-mini-stat">
                        <div class="admin-mini-stat-value">${totalSeats}</div>
                        <div class="admin-mini-stat-label">Sitzpl\u00e4tze gesamt</div>
                    </div>
                </div>
            </div>

            <hr class="admin-overview-divider">

            <div class="admin-overview-section">
                <h4 class="admin-overview-heading">
                    <span class="material-symbols-rounded">inventory</span>
                    R\u00e4ume im Detail
                </h4>
                <div class="admin-room-list">
                    ${(data.rooms || []).map(room => {
                        const bookingCount = room.bookings ? room.bookings.length : 0;
                        const statusClass = bookingCount > 0 ? 'busy' : 'free';
                        const statusLabel = bookingCount > 0 ? bookingCount + ' Buchung' + (bookingCount > 1 ? 'en' : '') : 'Frei';
                        return `
                            <div class="admin-room-item">
                                <div class="admin-room-name">
                                    <span class="admin-room-dot ${statusClass}"></span>
                                    <span>${escapeHTML(room.name)}</span>
                                </div>
                                <div class="admin-room-info">
                                    <span>${room.seats} Pl\u00e4tze</span>
                                    <span class="admin-room-status ${statusClass}">${statusLabel}</span>
                                </div>
                            </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    const activityCardHeader = document.querySelector('.activity-card .card-header h3');
    if (activityCardHeader) {
        activityCardHeader.textContent = 'Aktivit\u00e4ten-Feed';
    }

    const activityList = document.querySelector('.activity-list');
    if (activityList) {
        const feedItems = [];

        const modulesWithExams = data.modules
            .filter(m => m.exam && m.exam.date && (m.exam.status === 'registered' || m.exam.status === 'upcoming' || m.exam.status === 'open'))
            .sort((a, b) => new Date(a.exam.date) - new Date(b.exam.date));

        modulesWithExams.forEach(m => {
            let iconColor = 'primary';
            if (m.exam.status === 'upcoming') iconColor = 'warning';
            else if (m.exam.status === 'open') iconColor = 'success';
            feedItems.push({
                icon: 'event_note', color: iconColor,
                text: `Pr\u00fcfung <strong>${escapeHTML(m.name)}</strong>`,
                sub: `${formatDateDE(m.exam.date)} \u2022 ${escapeHTML(m.exam.room || 'Raum TBA')}`
            });
        });

        const gradedCount = Object.values(data.examResults || {}).reduce((s, r) => s + r.length, 0);
        if (gradedCount > 0) {
            feedItems.push({
                icon: 'assessment', color: 'secondary',
                text: `<strong>${gradedCount}</strong> Pr\u00fcfungsergebnisse eingetragen`,
                sub: `${Object.keys(data.examResults || {}).length} Pr\u00fcfungen bewertet`
            });
        }

        if (totalBookings > 0) {
            feedItems.push({
                icon: 'meeting_room', color: 'warning',
                text: `<strong>${totalBookings}</strong> aktive Raumbuchungen`,
                sub: `${roomsWithBookings.length} von ${totalRooms} R\u00e4umen belegt`
            });
        }

        activityList.innerHTML = feedItems.length > 0
            ? feedItems.map(item => `
                <li>
                    <div class="activity-icon ${item.color}">
                        <span class="material-symbols-rounded">${item.icon}</span>
                    </div>
                    <div class="activity-content">
                        <p class="activity-text">${item.text}</p>
                        <span class="activity-time">${item.sub}</span>
                    </div>
                </li>`).join('')
            : `<li>
                <div class="activity-icon primary">
                    <span class="material-symbols-rounded">check_circle</span>
                </div>
                <div class="activity-content">
                    <p class="activity-text">Keine aktuellen Aktivit\u00e4ten</p>
                </div>
            </li>`;
    }

    const actionsCardTitle = document.querySelector('.actions-card h3');
    if (actionsCardTitle) {
        actionsCardTitle.textContent = 'Schnellzugriff';
    }

    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
        actionButtons.innerHTML = `
            <button class="btn-action" data-nav="admin-users">
                <span class="material-symbols-rounded">manage_accounts</span>
                <span>Benutzer</span>
            </button>
            <button class="btn-action" data-nav="admin-rooms">
                <span class="material-symbols-rounded">meeting_room</span>
                <span>R\u00e4ume</span>
            </button>
            <button class="btn-action" data-nav="admin-events">
                <span class="material-symbols-rounded">event</span>
                <span>Veranstaltungen</span>
            </button>
            <button class="btn-action" data-nav="admin-exams">
                <span class="material-symbols-rounded">assessment</span>
                <span>Pr\u00fcfungsamt</span>
            </button>
        `;

        bindActionButtons(actionButtons, navigation);
    }
}
