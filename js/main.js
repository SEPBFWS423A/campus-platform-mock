import { initTheme } from './script/theme.js';
import { initAuth, checkAuth } from './script/auth.js';
import { initNavigation } from './script/navigation.js';
import { renderDashboard } from './script/dashboard.js';
import { renderSchedule } from './script/schedule.js';
import { renderGrades } from './script/grades.js';
import { renderExams } from './script/exams.js';
import { renderDownloads } from './script/downloads.js';
import { renderSubmissions } from './script/submissions.js';
import { renderDozentCourses, renderDozentGrading } from './script/dozent.js';
import { renderAdminStudents, renderAdminExams } from './script/admin.js';
import { initModal } from './script/modal.js';
import { initChangePassword } from './script/changePassword.js';
import { renderUserManagement } from './script/userManagement.js';
import { renderRoomManagement } from './script/roomManagement.js';
import { renderEventManagement } from './script/eventManagement.js';
import { renderExamResultsManagement } from './script/examResults.js';
import { escapeHTML, timeToMinutes } from './script/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Redirect to login page if not authenticated
    if (!checkAuth()) return;

    initTheme();
    initAuth();
    initModal();
    initChangePassword();
    const navigation = initNavigation();
    applyRoleVisibility();
    initData(navigation);
    navigation.setActiveTab('dashboard');
    initViewAllScheduleLink(navigation);
});

/**
 * Shows/hides navigation items and content sections based on the current user's role.
 * Reads data-roles attributes from nav items.
 */
function applyRoleVisibility() {
    if (typeof getCurrentUser !== 'function') return;
    const user = getCurrentUser();
    const role = user.role;

    // Show/hide nav items based on data-roles attribute
    document.querySelectorAll('.nav-item[data-roles]').forEach(item => {
        const roles = item.getAttribute('data-roles').split(',');
        item.classList.toggle('hidden', !roles.includes(role));
    });
}

function initData(navigation) {
    if (typeof mockData === 'undefined') {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="card empty-state-block error-state">
                    <span class="material-icons-round">error_outline</span>
                    <h2>Daten konnten nicht geladen werden</h2>
                    <p>Bitte versuchen Sie es sp\u00e4ter erneut.</p>
                </div>
            `;
        }
        return;
    }

    const user = getCurrentUser();

    try {
        // Render role-specific content
        if (user.role === 'student') {
            renderDashboard(mockData);
            renderSchedule(mockData);
            renderGrades(mockData);
            renderExams(mockData);
            renderDownloads(mockData);
            renderSubmissions(mockData);
        } else if (user.role === 'dozent') {
            renderDozentDashboard(mockData, user, navigation);
            renderDozentCourses(mockData, user);
            renderDozentGrading(mockData, user);
            renderDownloads(mockData);
        } else if (user.role === 'verwaltung') {
            renderVerwaltungDashboard(mockData, user, navigation);
            renderUserManagement(mockData);
            renderRoomManagement(mockData);
            renderEventManagement(mockData);
            renderExamResultsManagement(mockData);
            renderDownloads(mockData);
        }
    } catch (_) {
        // Silently handle render errors in production
    }

    // Set User Info in header
    const userNameElements = document.querySelectorAll('.dropdown-user-name');
    const userRoleElements = document.querySelectorAll('.dropdown-user-role');
    userNameElements.forEach(el => { el.textContent = user.name; });
    userRoleElements.forEach(el => { el.textContent = user.roleLabel; });

    const dashboardHeader = document.querySelector('#dashboard .header-content p');
    if (dashboardHeader) {
        dashboardHeader.textContent = `Willkommen zur\u00fcck, ${user.name}!`;
    }
}

/**
 * Wires up the "Alle ansehen" button on the dashboard to navigate
 * to the appropriate section based on the user's role.
 */
function initViewAllScheduleLink(navigation) {
    const btn = document.getElementById('view-all-schedule');
    if (!btn) return;

    const user = getCurrentUser();

    btn.addEventListener('click', () => {
        if (user.role === 'dozent') {
            navigation.setActiveTab('dozent-courses');
            const calendarTab = document.querySelector('#dozent-courses .section-tab[data-tab="dozent-calendar"]');
            if (calendarTab) calendarTab.click();
        } else {
            navigation.setActiveTab('schedule');
            const calendarTab = document.querySelector('#schedule .section-tab[data-tab="schedule-calendar"]');
            if (calendarTab) calendarTab.click();
        }
    });
}

// ---------------------------------------------------------------------------
// Dozent Dashboard
// ---------------------------------------------------------------------------

/**
 * Renders a comprehensive dashboard for the Dozent role, including:
 * - Stats row with active courses, student count, upcoming exams, and average grade
 * - Today's teaching schedule as a timeline
 * - Upcoming exams and recent activity feed
 * - Quick actions navigating to Dozent-specific sections
 */
function renderDozentDashboard(data, user, navigation) {
    const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

    const myCourses = data.modules.filter(m => m.dozentId === user.id);
    const activeCourses = myCourses.filter(m => m.status === 'active' || m.status === 'registered');
    const passedCourses = myCourses.filter(m => m.status === 'passed');
    const upcomingExams = activeCourses
        .filter(m => m.exam && m.exam.date)
        .sort((a, b) => new Date(a.exam.date) - new Date(b.exam.date));

    // Count total students (from user database)
    const totalStudents = data.users.filter(u => u.role === 'student').length;

    // Average grade across the dozent's graded courses
    let gradeSum = 0;
    let gradeCount = 0;
    passedCourses.forEach(c => {
        if (c.grade && typeof c.grade === 'number' && !Number.isNaN(c.grade)) {
            gradeSum += c.grade;
            gradeCount++;
        }
    });
    const avgGrade = gradeCount > 0 ? (gradeSum / gradeCount).toFixed(1) : '-';

    // --- 1. Stats Row (4 cards) ---
    const statsContainer = document.querySelector('.stats-row');
    if (statsContainer) {
        statsContainer.classList.add('stats-row-4');
        statsContainer.innerHTML = `
            <div class="card stat-card">
                <div class="stat-icon primary-bg">
                    <span class="material-icons-round">menu_book</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Aktive Kurse</span>
                    <span class="stat-value">${activeCourses.length}</span>
                    <span class="stat-desc">${myCourses.length} Kurse gesamt</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon success-bg">
                    <span class="material-icons-round">people</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Studierende</span>
                    <span class="stat-value">${totalStudents}</span>
                    <span class="stat-desc">Eingeschriebene Studierende</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon warning-bg">
                    <span class="material-icons-round">event</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Anstehende Pr\u00fcfungen</span>
                    <span class="stat-value">${upcomingExams.length}</span>
                    <span class="stat-desc">${upcomingExams.length > 0 ? 'N\u00e4chste: ' + escapeHTML(formatDateDE(upcomingExams[0].exam.date)) : 'Keine Termine'}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon secondary-bg">
                    <span class="material-icons-round">bar_chart</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Notenschnitt</span>
                    <span class="stat-value">${avgGrade}</span>
                    <span class="stat-desc">\u00dcber ${gradeCount} bewertete Kurse</span>
                </div>
            </div>
        `;
    }

    // --- 2. Schedule Card: Today's Teaching Schedule ---
    const scheduleCardHeader = document.querySelector('.schedule-card .card-header h3');
    if (scheduleCardHeader) {
        scheduleCardHeader.textContent = 'Heutige Lehrveranstaltungen';
    }

    const currentDayIndex = (new Date(data.config.currentDate).getDay() + 6) % 7;
    let todaysEvents = [];
    activeCourses.forEach(m => {
        if (m.schedule) {
            m.schedule.forEach(s => {
                if (s.day === currentDayIndex) {
                    todaysEvents.push({
                        time: s.start,
                        endTime: s.end,
                        title: m.name,
                        room: s.room,
                        type: s.type,
                        code: m.code,
                        status: 'future'
                    });
                }
            });
        }
    });

    todaysEvents.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    const currentSimTime = timeToMinutes(data.config.currentTime);

    todaysEvents = todaysEvents.map(e => {
        const eStart = timeToMinutes(e.time);
        const eEnd = timeToMinutes(e.endTime);
        let status = 'future';
        if (eEnd < currentSimTime) {
            status = 'past';
        } else if (eStart <= currentSimTime && eEnd >= currentSimTime) {
            status = 'current';
        }
        return { ...e, status };
    });

    const timelineContainer = document.querySelector('.timeline');
    if (timelineContainer) {
        if (todaysEvents.length > 0) {
            timelineContainer.innerHTML = todaysEvents.map(item => `
                <div class="timeline-item ${item.status}">
                    <div class="time">${escapeHTML(item.time)}</div>
                    <div class="marker"></div>
                    <div class="content">
                        ${item.status === 'current' ? '<span class="badge badge-sm">Jetzt</span>' : ''}
                        <h4>${escapeHTML(item.title)}</h4>
                        <p>${escapeHTML(item.room)} \u2022 ${escapeHTML(item.time)} - ${escapeHTML(item.endTime)} \u2022 ${escapeHTML(item.type)}</p>
                    </div>
                </div>
            `).join('');
        } else {
            timelineContainer.innerHTML = `
                <div class="timeline-item">
                    <div class="content empty-state-block">
                        <span class="material-icons-round">event_busy</span>
                        <p>Keine Lehrveranstaltungen am ${escapeHTML(dayNames[currentDayIndex] || 'heute')}.</p>
                    </div>
                </div>`;
        }
    }

    // --- 3. Activity Card: Upcoming Exams and Recent Activity ---
    const activityCardHeader = document.querySelector('.activity-card .card-header h3');
    if (activityCardHeader) {
        activityCardHeader.textContent = 'Pr\u00fcfungen & Aktivit\u00e4t';
    }

    const activityList = document.querySelector('.activity-list');
    if (activityList) {
        const items = [];

        // Upcoming exams for dozent's courses
        upcomingExams.forEach(c => {
            const dateStr = formatDateDE(c.exam.date);
            items.push(`
                <li>
                    <div class="activity-icon warning">
                        <span class="material-icons-round">event_note</span>
                    </div>
                    <div class="activity-content">
                        <p class="activity-text"><strong>${escapeHTML(c.name)}</strong> \u2013 ${escapeHTML(c.exam.type || 'Klausur')}</p>
                        <span class="activity-time">${escapeHTML(dateStr)}${c.exam.room ? ' \u2022 ' + escapeHTML(c.exam.room) : ''}${c.exam.time ? ' \u2022 ' + escapeHTML(c.exam.time) : ''}</span>
                    </div>
                </li>
            `);
        });

        // Simulated recent activity entries relevant to a dozent
        items.push(`
            <li>
                <div class="activity-icon primary">
                    <span class="material-icons-round">upload_file</span>
                </div>
                <div class="activity-content">
                    <p class="activity-text">3 neue Abgaben in <strong>IT-Projektmanagement</strong></p>
                    <span class="activity-time">Vor 2 Stunden</span>
                </div>
            </li>
        `);
        items.push(`
            <li>
                <div class="activity-icon success">
                    <span class="material-icons-round">check_circle</span>
                </div>
                <div class="activity-content">
                    <p class="activity-text">Notenvergabe f\u00fcr <strong>E-Business</strong> abgeschlossen</p>
                    <span class="activity-time">Gestern, 16:45</span>
                </div>
            </li>
        `);
        items.push(`
            <li>
                <div class="activity-icon warning">
                    <span class="material-icons-round">schedule</span>
                </div>
                <div class="activity-content">
                    <p class="activity-text">Notenfrist <strong>Gesch\u00e4ftsprozessmodellierung</strong> l\u00e4uft ab</p>
                    <span class="activity-time">In 5 Tagen</span>
                </div>
            </li>
        `);

        activityList.innerHTML = items.join('');
    }

    // --- 4. Quick Actions ---
    const actionsCardTitle = document.querySelector('.actions-card h3');
    if (actionsCardTitle) {
        actionsCardTitle.textContent = 'Schnellzugriff';
    }

    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
        actionButtons.innerHTML = `
            <button class="btn-action" data-nav="dozent-courses">
                <span class="material-icons-round">menu_book</span>
                <span>Meine Kurse</span>
            </button>
            <button class="btn-action" data-nav="dozent-grading">
                <span class="material-icons-round">grading</span>
                <span>Notenvergabe</span>
            </button>
            <button class="btn-action" data-nav="downloads">
                <span class="material-icons-round">folder</span>
                <span>Downloads</span>
            </button>
            <button class="btn-action" data-nav="info">
                <span class="material-icons-round">info</span>
                <span>Uni-Info</span>
            </button>
        `;

        bindActionButtons(actionButtons, navigation);
    }
}

// ---------------------------------------------------------------------------
// Verwaltung Dashboard
// ---------------------------------------------------------------------------

/**
 * Renders a comprehensive dashboard for the Verwaltung role, including:
 * - Stats row with user count, room count, event series, and exam results
 * - System overview with user breakdown by role and room utilization
 * - Upcoming exams across all modules
 * - Quick actions navigating to all admin management sections
 */
function renderVerwaltungDashboard(data, user, navigation) {
    const totalUsers = data.users.length;
    const totalRooms = (data.rooms || []).length;
    const totalSeries = (data.eventSeries || []).length;

    // User breakdown
    const students = data.users.filter(u => u.role === 'student');
    const dozenten = data.users.filter(u => u.role === 'dozent');
    const verwaltungUsers = data.users.filter(u => u.role === 'verwaltung');

    // Count total exam results entered
    const examResultsObj = data.examResults || {};
    let totalExamResults = 0;
    Object.values(examResultsObj).forEach(results => {
        totalExamResults += results.length;
    });
    const examResultKeys = Object.keys(examResultsObj).length;

    // Room utilization
    const roomsWithBookings = (data.rooms || []).filter(r => r.bookings && r.bookings.length > 0);
    const totalBookings = (data.rooms || []).reduce((sum, r) => sum + (r.bookings ? r.bookings.length : 0), 0);
    const totalSeats = (data.rooms || []).reduce((sum, r) => sum + (r.seats || 0), 0);

    // Total events across all series
    const totalEvents = (data.eventSeries || []).reduce((sum, es) => sum + (es.events ? es.events.length : 0), 0);

    // --- 1. Stats Row (4 cards) ---
    const statsContainer = document.querySelector('.stats-row');
    if (statsContainer) {
        statsContainer.classList.add('stats-row-4');
        statsContainer.innerHTML = `
            <div class="card stat-card">
                <div class="stat-icon primary-bg">
                    <span class="material-icons-round">people</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Benutzer gesamt</span>
                    <span class="stat-value">${totalUsers}</span>
                    <span class="stat-desc">${students.length} Stud. \u2022 ${dozenten.length} Doz. \u2022 ${verwaltungUsers.length} Verw.</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon warning-bg">
                    <span class="material-icons-round">meeting_room</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">R\u00e4ume</span>
                    <span class="stat-value">${totalRooms}</span>
                    <span class="stat-desc">${roomsWithBookings.length} belegt \u2022 ${totalRooms - roomsWithBookings.length} frei</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon success-bg">
                    <span class="material-icons-round">event</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Veranstaltungsreihen</span>
                    <span class="stat-value">${totalSeries}</span>
                    <span class="stat-desc">${totalEvents} Events insgesamt</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon secondary-bg">
                    <span class="material-icons-round">assessment</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Pr\u00fcfungsergebnisse</span>
                    <span class="stat-value">${totalExamResults}</span>
                    <span class="stat-desc">${examResultKeys} Pr\u00fcfungen bewertet</span>
                </div>
            </div>
        `;
    }

    // --- 2. Schedule Card becomes "System\u00fcbersicht" ---
    const scheduleCardHeader = document.querySelector('.schedule-card .card-header h3');
    if (scheduleCardHeader) {
        scheduleCardHeader.textContent = 'System\u00fcbersicht';
    }

    // Hide the "Alle ansehen" button for verwaltung (not applicable)
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
                    <span class="material-icons-round">group</span>
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
                    <span class="material-icons-round">meeting_room</span>
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
                    <span class="material-icons-round">inventory</span>
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

    // --- 3. Activity Card: Upcoming Exams ---
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
                            <span class="material-icons-round">event_note</span>
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
                        <span class="material-icons-round">check_circle</span>
                    </div>
                    <div class="activity-content">
                        <p class="activity-text">Keine anstehenden Pr\u00fcfungen</p>
                        <span class="activity-time">Alle Pr\u00fcfungen abgeschlossen</span>
                    </div>
                </li>
            `;
        }
    }

    // --- 4. Quick Actions ---
    const actionsCardTitle = document.querySelector('.actions-card h3');
    if (actionsCardTitle) {
        actionsCardTitle.textContent = 'Schnellzugriff';
    }

    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
        actionButtons.innerHTML = `
            <button class="btn-action" data-nav="admin-users">
                <span class="material-icons-round">manage_accounts</span>
                <span>Benutzer</span>
            </button>
            <button class="btn-action" data-nav="admin-rooms">
                <span class="material-icons-round">meeting_room</span>
                <span>R\u00e4ume</span>
            </button>
            <button class="btn-action" data-nav="admin-events">
                <span class="material-icons-round">event</span>
                <span>Veranstaltungen</span>
            </button>
            <button class="btn-action" data-nav="admin-exams">
                <span class="material-icons-round">assessment</span>
                <span>Pr\u00fcfungsamt</span>
            </button>
        `;

        bindActionButtons(actionButtons, navigation);
    }
}

// ---------------------------------------------------------------------------
// Shared Helpers
// ---------------------------------------------------------------------------

/**
 * Binds click events to quick-action buttons that navigate to the
 * section specified in their data-nav attribute.
 */
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

/**
 * Formats an ISO date string (YYYY-MM-DD) to German locale (DD.MM.YYYY).
 * Returns the original string if parsing fails.
 */
function formatDateDE(isoDate) {
    if (!isoDate) return 'TBA';
    try {
        const d = new Date(isoDate);
        if (Number.isNaN(d.getTime())) return isoDate;
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (_) {
        return isoDate;
    }
}
