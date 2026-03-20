import { timeToMinutes, escapeHTML } from '../../core/utils.js';
import { initTabs } from '../shared/tabSwitching.js';
import { getWeekData } from '../shared/scheduleUtils.js';
import { buildCourseCard, buildPastCoursesSection } from '../shared/courseCardHelpers.js';

export function renderSchedule(data) {
    renderModuleOverview(data);
    renderCalendar(data);
    initScheduleTabs();
}

function renderModuleOverview(data) {
    const container = document.querySelector('#schedule-overview .dozent-courses-grid');
    const pastContainer = document.querySelector('#schedule-overview .past-courses-container');
    if (!container) return;

    const activeModules = data.modules.filter(m => m.status === 'active' || m.status === 'registered');
    const pastModules = data.modules.filter(m => m.status === 'passed' || m.status === 'failed');

    if (activeModules.length === 0 && pastModules.length === 0) {
        container.innerHTML = '<p>Keine Kurse gefunden.</p>';
        return;
    }

    container.innerHTML = activeModules.map(m => {
        const extraMetaRows = `
            <div class="dozent-meta-row">
                <span class="material-symbols-rounded" aria-hidden="true">person</span>
                <span>${escapeHTML(m.lecturer || '-')} &bull; ${escapeHTML(m.semester || '')}</span>
            </div>`;
        return buildCourseCard(m, { extraMetaRows });
    }).join('');

    if (pastContainer) {
        pastContainer.innerHTML = pastModules.length > 0 ? buildPastCoursesSection(pastModules) : '';
    }
}

function renderCalendar(data) {
    const now = new Date();
    const currentWeekData = getWeekData(now);

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
    initTabs(section, { tabSelector: '.section-tab', panelSelector: '.tab-content', useAria: true });
}

export function renderCalendarForModules(modules, gridSelector, weekLabelId) {
    const now = new Date();
    const currentWeekData = getWeekData(now);

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
