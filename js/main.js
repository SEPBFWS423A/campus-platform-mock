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
import { escapeHTML } from './script/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Redirect to login page if not authenticated
    if (!checkAuth()) return;

    initTheme();
    initAuth();
    initModal();
    initChangePassword();
    const navigation = initNavigation();
    applyRoleVisibility();
    initData();
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

function initData() {
    if (typeof mockData === 'undefined') {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="card" style="text-align: center; padding: 3rem;">
                    <span class="material-icons-round" style="font-size: 3rem; color: var(--error-color);">error_outline</span>
                    <h2>Daten konnten nicht geladen werden</h2>
                    <p>Bitte versuchen Sie es später erneut.</p>
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
            renderDozentDashboard(mockData, user);
            renderDozentCourses(mockData, user);
            renderDozentGrading(mockData, user);
            renderDownloads(mockData);
        } else if (user.role === 'verwaltung') {
            renderVerwaltungDashboard(mockData, user);
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
        dashboardHeader.textContent = `Willkommen zurück, ${user.name}!`;
    }
}

/**
 * Wires up the "Alle ansehen" button on the dashboard to navigate
 * to the schedule section and activate the calendar sub-tab.
 */
function initViewAllScheduleLink(navigation) {
    const btn = document.getElementById('view-all-schedule');
    if (!btn) return;

    btn.addEventListener('click', () => {
        navigation.setActiveTab('schedule');
        // Activate the calendar sub-tab
        const calendarTab = document.querySelector('#schedule .section-tab[data-tab="schedule-calendar"]');
        if (calendarTab) calendarTab.click();
    });
}

/**
 * Renders a basic dashboard for Dozent role.
 */
function renderDozentDashboard(data, user) {
    const myCourses = data.modules.filter(m => m.dozentId === user.id);
    const activeCourses = myCourses.filter(m => m.status === 'active' || m.status === 'registered');
    const upcomingExams = activeCourses.filter(m => m.exam);

    const statsContainer = document.querySelector('.stats-row');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="card stat-card">
                <div class="stat-icon primary-bg"><span class="material-icons-round">menu_book</span></div>
                <div class="stat-info">
                    <span class="stat-label">Aktive Kurse</span>
                    <span class="stat-value">${activeCourses.length}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon warning-bg"><span class="material-icons-round">event</span></div>
                <div class="stat-info">
                    <span class="stat-label">Anstehende Prüfungen</span>
                    <span class="stat-value">${upcomingExams.length}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon success-bg"><span class="material-icons-round">history_edu</span></div>
                <div class="stat-info">
                    <span class="stat-label">Kurse gesamt</span>
                    <span class="stat-value">${myCourses.length}</span>
                </div>
            </div>
        `;
    }

    const timelineContainer = document.querySelector('.timeline');
    if (timelineContainer) {
        if (activeCourses.length > 0) {
            timelineContainer.innerHTML = activeCourses.map(c => `
                <div class="timeline-item future">
                    <div class="time">${c.schedule && c.schedule[0] ? escapeHTML(c.schedule[0].start) : '-'}</div>
                    <div class="marker"></div>
                    <div class="content">
                        <h4>${escapeHTML(c.name)}</h4>
                        <p>${escapeHTML(c.code)} &bull; ${escapeHTML(String(c.ects))} ECTS</p>
                    </div>
                </div>
            `).join('');
        } else {
            timelineContainer.innerHTML = '<div class="timeline-item"><div class="content"><p>Keine aktiven Kurse.</p></div></div>';
        }
    }

    const activityList = document.querySelector('.activity-list');
    if (activityList) {
        activityList.innerHTML = `
            <li>
                <div class="activity-icon primary"><span class="material-icons-round">info</span></div>
                <div class="activity-content">
                    <p class="activity-text">Dozenten-Dashboard – Grundlegende Ansicht</p>
                    <span class="activity-time">Wird in Zukunft erweitert</span>
                </div>
            </li>
        `;
    }
}

/**
 * Renders a basic dashboard for Verwaltung role.
 */
function renderVerwaltungDashboard(data, user) {
    const totalUsers = data.users.length;
    const totalRooms = (data.rooms || []).length;
    const totalSeries = (data.eventSeries || []).length;

    const statsContainer = document.querySelector('.stats-row');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="card stat-card">
                <div class="stat-icon primary-bg"><span class="material-icons-round">people</span></div>
                <div class="stat-info">
                    <span class="stat-label">Benutzer gesamt</span>
                    <span class="stat-value">${totalUsers}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon warning-bg"><span class="material-icons-round">meeting_room</span></div>
                <div class="stat-info">
                    <span class="stat-label">Räume</span>
                    <span class="stat-value">${totalRooms}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon success-bg"><span class="material-icons-round">event</span></div>
                <div class="stat-info">
                    <span class="stat-label">Veranstaltungsreihen</span>
                    <span class="stat-value">${totalSeries}</span>
                </div>
            </div>
        `;
    }

    const timelineContainer = document.querySelector('.timeline');
    if (timelineContainer) {
        timelineContainer.innerHTML = '<div class="timeline-item"><div class="content"><p>Verwaltungs-Übersicht – Keine Stundenplan-Anzeige.</p></div></div>';
    }

    const activityList = document.querySelector('.activity-list');
    if (activityList) {
        activityList.innerHTML = `
            <li>
                <div class="activity-icon primary"><span class="material-icons-round">info</span></div>
                <div class="activity-content">
                    <p class="activity-text">Verwaltungs-Dashboard – Grundlegende Ansicht</p>
                    <span class="activity-time">Wird in Zukunft erweitert</span>
                </div>
            </li>
        `;
    }
}
