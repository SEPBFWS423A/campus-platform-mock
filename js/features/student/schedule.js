import { timeToMinutes, escapeHTML } from '../../core/utils.js';

export function renderSchedule(data) {
    renderModuleOverview(data);
    renderCalendar(data);
    initScheduleTabs();
}

function renderModuleOverview(data) {
    const container = document.querySelector('#schedule-overview .module-overview-card');
    if (!container) return;

    const currentModules = data.modules.filter(m => m.status === 'active' || m.status === 'registered');

    let rows = '';
    currentModules.forEach(m => {
        const examType = m.exam?.type || 'Klausur';
        const lecturer = m.lecturer || '-';

        rows += `
            <tr>
                <td>
                    <div class="module-cell">
                        <span class="module-code">${escapeHTML(m.code)}</span>
                        <span class="module-name">${escapeHTML(m.name)}</span>
                    </div>
                </td>
                <td>${escapeHTML(lecturer)}</td>
                <td><span class="exam-type-tag">${escapeHTML(examType)}</span></td>
                <td><span class="credits-pill">${m.ects} ECTS</span></td>
            </tr>`;
    });

    container.innerHTML = `
        <table class="module-overview-table">
            <thead>
                <tr>
                    <th scope="col">Modul</th>
                    <th scope="col">Dozent</th>
                    <th scope="col">Prüfungsform</th>
                    <th scope="col">ECTS</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>`;
}

function renderCalendar(data) {
    const now = new Date();
    const currentWeekData = getCurrentWeekData(now);

    const weekHeader = document.getElementById('calendar-week-label');
    if (weekHeader) weekHeader.textContent = currentWeekData.label;

    const grid = document.querySelector('#schedule-calendar .calendar-grid-detailed');
    if (grid) {
        const timeColumn = grid.firstElementChild.outerHTML;
        const dayColumns = currentWeekData.days.map((dayLabel, dayIndex) => {
            let dayEvents = [];
            data.modules.forEach(m => {
                if (m.schedule) {
                    m.schedule.filter(s => s.day === dayIndex).forEach(s => {
                        const startMin = timeToMinutes(s.start);
                        const endMin = timeToMinutes(s.end);
                        const duration = endMin - startMin;
                        const top = startMin - 480;
                        const height = duration;

                        dayEvents.push({
                            title: m.name,
                            time: `${s.start} - ${s.end}`,
                            loc: s.room,
                            color: s.color || "blue",
                            top: top,
                            height: height
                        });
                    });
                }
            });

            const isToday = dayIndex === (now.getDay() + 6) % 7;

            return `
                <div class="day-column">
                    <div class="day-header ${isToday ? 'current-day' : ''}">${dayLabel}</div>
                    <div class="day-content">
                        ${dayEvents.map(event => `
                            <div class="calendar-event ${event.color}" style="top: ${event.top}px; height: ${event.height}px;">
                                <span class="event-time">${escapeHTML(event.time)}</span>
                                <span class="event-title">${escapeHTML(event.title)}</span>
                                <span class="event-loc">${escapeHTML(event.loc)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
             `;
        }).join('');

        grid.innerHTML = timeColumn + dayColumns;
    }
}

function initScheduleTabs() {
    const section = document.getElementById('schedule');
    if (!section) return;
    initSectionTabs(section);
}

export function initSectionTabs(section) {
    const tabs = section.querySelectorAll('.section-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            section.querySelectorAll('.tab-content').forEach(panel => {
                panel.classList.remove('active');
            });
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });
}

function getCurrentWeekData(date) {
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);

    const jan4 = new Date(monday.getFullYear(), 0, 4);
    const dayOfYear = Math.floor((monday - new Date(monday.getFullYear(), 0, 1)) / 86400000);
    const weekNumber = Math.ceil((dayOfYear + jan4.getDay()) / 7);

    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
    const days = [];
    for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        days.push(`${dayNames[i]} ${dd}.${mm}`);
    }

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const monDD = String(monday.getDate()).padStart(2, '0');
    const monMM = String(monday.getMonth() + 1).padStart(2, '0');
    const friDD = String(friday.getDate()).padStart(2, '0');
    const friMM = String(friday.getMonth() + 1).padStart(2, '0');

    const label = `KW ${weekNumber} (${monDD}.${monMM} - ${friDD}.${friMM})`;

    return { label, days };
}

export function renderCalendarForModules(modules, gridSelector, weekLabelId) {
    const now = new Date();
    const currentWeekData = getCurrentWeekData(now);

    const weekHeader = document.getElementById(weekLabelId);
    if (weekHeader) weekHeader.textContent = currentWeekData.label;

    const grid = document.querySelector(gridSelector);
    if (!grid) return;

    const timeColumn = grid.firstElementChild.outerHTML;
    const dayColumns = currentWeekData.days.map((dayLabel, dayIndex) => {
        let dayEvents = [];
        modules.forEach(m => {
            if (m.schedule) {
                m.schedule.filter(s => s.day === dayIndex).forEach(s => {
                    const startMin = timeToMinutes(s.start);
                    const endMin = timeToMinutes(s.end);
                    const duration = endMin - startMin;
                    const top = startMin - 480;
                    const height = duration;

                    dayEvents.push({
                        title: m.name,
                        time: `${s.start} - ${s.end}`,
                        loc: s.room,
                        color: s.color || "blue",
                        top: top,
                        height: height
                    });
                });
            }
        });

        const isToday = dayIndex === (now.getDay() + 6) % 7;

        return `
            <div class="day-column">
                <div class="day-header ${isToday ? 'current-day' : ''}">${dayLabel}</div>
                <div class="day-content">
                    ${dayEvents.map(event => `
                        <div class="calendar-event ${event.color}" style="top: ${event.top}px; height: ${event.height}px;">
                            <span class="event-time">${escapeHTML(event.time)}</span>
                            <span class="event-title">${escapeHTML(event.title)}</span>
                            <span class="event-loc">${escapeHTML(event.loc)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
         `;
    }).join('');

    grid.innerHTML = timeColumn + dayColumns;
}
