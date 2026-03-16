import { escapeHTML, formatDateDE } from '../../core/utils.js';

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
        statsContainer.innerHTML = `
            <div class="card stat-card">
                <div class="stat-icon primary-bg">
                    <span class="material-symbols-rounded">people</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Benutzer gesamt</span>
                    <span class="stat-value">${totalUsers}</span>
                    <span class="stat-desc">${students.length} Stud. \u2022 ${dozenten.length} Doz. \u2022 ${verwaltungUsers.length} Verw.</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon warning-bg">
                    <span class="material-symbols-rounded">meeting_room</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">R\u00e4ume</span>
                    <span class="stat-value">${totalRooms}</span>
                    <span class="stat-desc">${roomsWithBookings.length} belegt \u2022 ${totalRooms - roomsWithBookings.length} frei</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon success-bg">
                    <span class="material-symbols-rounded">event</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Veranstaltungsreihen</span>
                    <span class="stat-value">${totalSeries}</span>
                    <span class="stat-desc">${totalEvents} Events insgesamt</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon secondary-bg">
                    <span class="material-symbols-rounded">assessment</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Pr\u00fcfungsergebnisse</span>
                    <span class="stat-value">${totalExamResults}</span>
                    <span class="stat-desc">${examResultKeys} Pr\u00fcfungen bewertet</span>
                </div>
            </div>
        `;
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
        activityCardHeader.textContent = 'Anstehende Pr\u00fcfungen';
    }

    const activityList = document.querySelector('.activity-list');
    if (activityList) {
        const modulesWithExams = data.modules
            .filter(m => m.exam && m.exam.date && (m.exam.status === 'registered' || m.exam.status === 'upcoming' || m.exam.status === 'open'))
            .sort((a, b) => new Date(a.exam.date) - new Date(b.exam.date));

        if (modulesWithExams.length > 0) {
            activityList.innerHTML = modulesWithExams.map(m => {
                const dateStr = formatDateDE(m.exam.date);
                let iconColor = 'primary';
                if (m.exam.status === 'upcoming') iconColor = 'warning';
                else if (m.exam.status === 'open') iconColor = 'success';

                return `
                    <li>
                        <div class="activity-icon ${iconColor}">
                            <span class="material-symbols-rounded">event_note</span>
                        </div>
                        <div class="activity-content">
                            <p class="activity-text"><strong>${escapeHTML(m.name)}</strong></p>
                            <span class="activity-time">${escapeHTML(dateStr)} \u2022 ${escapeHTML(m.exam.room || 'Raum TBA')} \u2022 ${escapeHTML(m.exam.type || 'Klausur')}</span>
                        </div>
                    </li>
                `;
            }).join('');
        } else {
            activityList.innerHTML = `
                <li>
                    <div class="activity-icon primary">
                        <span class="material-symbols-rounded">check_circle</span>
                    </div>
                    <div class="activity-content">
                        <p class="activity-text">Keine anstehenden Pr\u00fcfungen</p>
                        <span class="activity-time">Alle Pr\u00fcfungen abgeschlossen</span>
                    </div>
                </li>
            `;
        }
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

function bindActionButtons(container, navigation) {
    container.querySelectorAll('.btn-action[data-nav]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-nav');
            if (target && navigation) {
                navigation.setActiveTab(target);
            }
        });
    });
}
