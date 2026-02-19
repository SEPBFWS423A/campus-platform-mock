import { initTheme } from './script/theme.js';
import { initAuth, initLogin } from './script/auth.js';
import { initNavigation } from './script/navigation.js';
import { renderDashboard } from './script/dashboard.js';
import { renderSchedule } from './script/schedule.js';
import { renderGrades } from './script/grades.js';
import { renderExams } from './script/exams.js';
import { renderDownloads } from './script/downloads.js';
import { renderSubmissions } from './script/submissions.js';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuth();
    const navigation = initNavigation();

    initLogin(() => {
        initData();
        const defaultTarget = 'dashboard';
        navigation.setActiveTab(defaultTarget);
    });
});

function initData() {
    if (typeof mockData !== 'undefined') {
        console.log("Initializing Mock Data...");

        // Render sections
        renderDashboard(mockData);
        renderSchedule(mockData);
        renderGrades(mockData);
        renderExams(mockData);
        renderDownloads(mockData);
        renderSubmissions(mockData);

        // Set User Info
        const userNameElements = document.querySelectorAll('.dropdown-user-name');
        const userRoleElements = document.querySelectorAll('.dropdown-user-role');
        if (mockData.user) {
            userNameElements.forEach(el => el.textContent = mockData.user.name);
            userRoleElements.forEach(el => el.textContent = mockData.user.role);

            const dashboardHeader = document.querySelector('#dashboard .header-content p');
            if (dashboardHeader) dashboardHeader.textContent = `Willkommen zurück, ${mockData.user.name}!`;
        }

    } else {
        console.error("Mock Data not loaded!");
    }
}
