import { initTheme } from './script/theme.js';
import { initAuth, checkAuth } from './script/auth.js';
import { initNavigation } from './script/navigation.js';
import { renderDashboard } from './script/dashboard.js';
import { renderSchedule } from './script/schedule.js';
import { renderGrades } from './script/grades.js';
import { renderExams } from './script/exams.js';
import { renderDownloads } from './script/downloads.js';
import { renderSubmissions } from './script/submissions.js';

document.addEventListener('DOMContentLoaded', () => {
    // Redirect to login page if not authenticated
    if (!checkAuth()) return;

    initTheme();
    initAuth();
    const navigation = initNavigation();
    initData();
    navigation.setActiveTab('dashboard');
});

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

    try {
        renderDashboard(mockData);
        renderSchedule(mockData);
        renderGrades(mockData);
        renderExams(mockData);
        renderDownloads(mockData);
        renderSubmissions(mockData);
    } catch (_) {
        // Silently handle render errors in production
    }

    // Set User Info
    const userNameElements = document.querySelectorAll('.dropdown-user-name');
    const userRoleElements = document.querySelectorAll('.dropdown-user-role');
    if (mockData.user) {
        userNameElements.forEach(el => { el.textContent = mockData.user.name; });
        userRoleElements.forEach(el => { el.textContent = mockData.user.role; });

        const dashboardHeader = document.querySelector('#dashboard .header-content p');
        if (dashboardHeader) {
            dashboardHeader.textContent = `Willkommen zurück, ${mockData.user.name}!`;
        }
    }
}
