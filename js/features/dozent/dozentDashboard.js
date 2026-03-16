import { escapeHTML, timeToMinutes, formatDateDE } from '../../core/utils.js';

export function renderDozentDashboard(data, user, navigation) {
    const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

    const myCourses = data.modules.filter(m => m.dozentId === user.id);
    const activeCourses = myCourses.filter(m => m.status === 'active' || m.status === 'registered');
    const passedCourses = myCourses.filter(m => m.status === 'passed');
    const upcomingExams = activeCourses
        .filter(m => m.exam && m.exam.date)
        .sort((a, b) => new Date(a.exam.date) - new Date(b.exam.date));

    const totalStudents = data.users.filter(u => u.role === 'student').length;

    let gradeSum = 0;
    let gradeCount = 0;
    passedCourses.forEach(c => {
        if (c.grade && typeof c.grade === 'number' && !Number.isNaN(c.grade)) {
            gradeSum += c.grade;
            gradeCount++;
        }
    });
    const avgGrade = gradeCount > 0 ? (gradeSum / gradeCount).toFixed(1) : '-';

    const statsContainer = document.querySelector('.stats-row');
    if (statsContainer) {
        statsContainer.classList.add('stats-row-4');
        statsContainer.innerHTML = `
            <div class="card stat-card">
                <div class="stat-icon primary-bg">
                    <span class="material-symbols-rounded">menu_book</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Aktive Kurse</span>
                    <span class="stat-value">${activeCourses.length}</span>
                    <span class="stat-desc">${myCourses.length} Kurse gesamt</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon success-bg">
                    <span class="material-symbols-rounded">people</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Studierende</span>
                    <span class="stat-value">${totalStudents}</span>
                    <span class="stat-desc">Eingeschriebene Studierende</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon warning-bg">
                    <span class="material-symbols-rounded">event</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Anstehende Pr\u00fcfungen</span>
                    <span class="stat-value">${upcomingExams.length}</span>
                    <span class="stat-desc">${upcomingExams.length > 0 ? 'N\u00e4chste: ' + escapeHTML(formatDateDE(upcomingExams[0].exam.date)) : 'Keine Termine'}</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon secondary-bg">
                    <span class="material-symbols-rounded">bar_chart</span>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Notenschnitt</span>
                    <span class="stat-value">${avgGrade}</span>
                    <span class="stat-desc">\u00dcber ${gradeCount} bewertete Kurse</span>
                </div>
            </div>
        `;
    }

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
                        <span class="material-symbols-rounded">event_busy</span>
                        <p>Keine Lehrveranstaltungen am ${escapeHTML(dayNames[currentDayIndex] || 'heute')}.</p>
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
