import { formatCurrentDateDE } from './core/utils.js';
import { initTheme } from './core/theme.js';
import { initAuth, checkAuth } from './core/auth.js';
import { initNavigation } from './core/navigation.js';
import { initModal } from './core/modal.js';
import { initChangePassword } from './features/shared/changePassword.js';
import { renderDashboard } from './features/student/dashboard.js';
import { renderSchedule } from './features/student/schedule.js';
import { renderGrades } from './features/student/grades.js';
import { renderExams } from './features/student/exams.js';
import { renderDownloads } from './features/shared/downloads.js';
import { renderSubmissions } from './features/student/submissions.js';
import { renderDozentDashboard } from './features/dozent/dozentDashboard.js';
import { renderDozentCourses } from './features/dozent/courses.js';
import { renderDozentGrading } from './features/dozent/grading.js';
import { renderVerwaltungDashboard } from './features/verwaltung/verwaltungDashboard.js';
import { renderUserManagement } from './features/verwaltung/userManagement.js';
import { renderRoomManagement } from './features/verwaltung/roomManagement/index.js';
import { renderEventManagement } from './features/verwaltung/eventManagement/index.js';
import { renderExamResultsManagement } from './features/verwaltung/examResults/index.js';

document.addEventListener('DOMContentLoaded', () => {
    // Redirect to login page if not authenticated
    if (!checkAuth()) return;

    initTheme();
    initAuth();
    initModal();
    initChangePassword();

    const dateEl = document.getElementById('current-date');
    if (dateEl) dateEl.textContent = formatCurrentDateDE();
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
