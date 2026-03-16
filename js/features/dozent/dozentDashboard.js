import { escapeHTML, formatDateDE, calculateAverage } from '../../core/utils.js';
import { buildStatCard, bindActionButtons } from '../shared/uiComponents.js';
import { buildTodaysSchedule } from '../shared/scheduleUtils.js';
import { DAY_NAMES } from '../shared/constants.js';
import { getDozentCourses, getActiveDozentCourses } from '../shared/dataHelpers.js';

export function renderDozentDashboard(data, user, navigation) {
    const myCourses = getDozentCourses(data, user.id);
    const activeCourses = getActiveDozentCourses(data, user.id);
    const passedCourses = myCourses.filter(m => m.status === 'passed');
    const upcomingExams = activeCourses
        .filter(m => m.exam && m.exam.date)
        .sort((a, b) => new Date(a.exam.date) - new Date(b.exam.date));

    const totalStudents = data.users.filter(u => u.role === 'student').length;

    const gradeCount = passedCourses.filter(c => c.grade && typeof c.grade === 'number' && !Number.isNaN(c.grade)).length;
    const avgGrade = calculateAverage(passedCourses);

    const statsContainer = document.querySelector('.stats-row');
    if (statsContainer) {
        statsContainer.classList.add('stats-row-4');
        statsContainer.innerHTML = [
            buildStatCard({ label: 'Aktive Kurse', value: activeCourses.length, icon: 'menu_book', colorClass: 'primary-bg', desc: `${myCourses.length} Kurse gesamt` }),
            buildStatCard({ label: 'Studierende', value: totalStudents, icon: 'people', colorClass: 'success-bg', desc: 'Eingeschriebene Studierende' }),
            buildStatCard({ label: 'Anstehende Pr\u00fcfungen', value: upcomingExams.length, icon: 'event', colorClass: 'warning-bg', desc: upcomingExams.length > 0 ? 'N\u00e4chste: ' + escapeHTML(formatDateDE(upcomingExams[0].exam.date)) : 'Keine Termine' }),
            buildStatCard({ label: 'Notenschnitt', value: avgGrade, icon: 'bar_chart', colorClass: 'secondary-bg', desc: `\u00dcber ${gradeCount} bewertete Kurse` })
        ].join('');
    }

    const scheduleCardHeader = document.querySelector('.schedule-card .card-header h3');
    if (scheduleCardHeader) {
        scheduleCardHeader.textContent = 'Heutige Lehrveranstaltungen';
    }

    const todaysEvents = buildTodaysSchedule(activeCourses, data.config);
    const currentDayIndex = (new Date(data.config.currentDate).getDay() + 6) % 7;

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
                        <span class="material-symbols-rounded">event_busy</span>
                        <p>Keine Lehrveranstaltungen am ${escapeHTML(DAY_NAMES[currentDayIndex] || 'heute')}.</p>
                    </div>
                </div>`;
        }
    }

    const activityCardHeader = document.querySelector('.activity-card .card-header h3');
    if (activityCardHeader) {
        activityCardHeader.textContent = 'Pr\u00fcfungen & Aktivit\u00e4t';
    }

    const activityList = document.querySelector('.activity-list');
    if (activityList) {
        const items = [];

        upcomingExams.forEach(c => {
            const dateStr = formatDateDE(c.exam.date);
            items.push(`
                <li>
                    <div class="activity-icon warning">
                        <span class="material-symbols-rounded">event_note</span>
                    </div>
                    <div class="activity-content">
                        <p class="activity-text"><strong>${escapeHTML(c.name)}</strong> \u2013 ${escapeHTML(c.exam.type || 'Klausur')}</p>
                        <span class="activity-time">${escapeHTML(dateStr)}${c.exam.room ? ' \u2022 ' + escapeHTML(c.exam.room) : ''}${c.exam.time ? ' \u2022 ' + escapeHTML(c.exam.time) : ''}</span>
                    </div>
                </li>
            `);
        });

        items.push(`
            <li>
                <div class="activity-icon primary">
                    <span class="material-symbols-rounded">upload_file</span>
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
                    <span class="material-symbols-rounded">check_circle</span>
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
                    <span class="material-symbols-rounded">schedule</span>
                </div>
                <div class="activity-content">
                    <p class="activity-text">Notenfrist <strong>Gesch\u00e4ftsprozessmodellierung</strong> l\u00e4uft ab</p>
                    <span class="activity-time">In 5 Tagen</span>
                </div>
            </li>
        `);

        activityList.innerHTML = items.join('');
    }

    const actionsCardTitle = document.querySelector('.actions-card h3');
    if (actionsCardTitle) {
        actionsCardTitle.textContent = 'Schnellzugriff';
    }

    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
        actionButtons.innerHTML = `
            <button class="btn-action" data-nav="dozent-courses">
                <span class="material-symbols-rounded">menu_book</span>
                <span>Meine Kurse</span>
            </button>
            <button class="btn-action" data-nav="dozent-grading">
                <span class="material-symbols-rounded">grading</span>
                <span>Notenvergabe</span>
            </button>
            <button class="btn-action" data-nav="downloads">
                <span class="material-symbols-rounded">folder</span>
                <span>Downloads</span>
            </button>
            <button class="btn-action" data-nav="info">
                <span class="material-symbols-rounded">info</span>
                <span>Uni-Info</span>
            </button>
        `;

        bindActionButtons(actionButtons, navigation);
    }
}
