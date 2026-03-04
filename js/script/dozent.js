import { escapeHTML } from './utils.js';
import { initSectionTabs, renderCalendarForModules } from './schedule.js';

/**
 * Renders the Dozent's course overview with two sub-tabs:
 * 1. Module overview (course cards)
 * 2. Calendar (weekly timetable for dozent's courses)
 */
export function renderDozentCourses(data, user) {
    renderDozentOverview(data, user);
    renderDozentCalendar(data, user);
    initDozentTabs();
}

/**
 * Renders the Dozent's course cards in the overview tab.
 */
function renderDozentOverview(data, user) {
    const container = document.querySelector('.dozent-courses-grid');
    if (!container) return;

    const myCourses = data.modules.filter(m => m.dozentId === user.id);
    const activeCourses = myCourses.filter(m => m.status === 'active' || m.status === 'registered');
    const pastCourses = myCourses.filter(m => m.status === 'passed' || m.status === 'failed');

    if (myCourses.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 2rem; grid-column: 1 / -1;">
                <span class="material-icons-round" style="font-size: 2.5rem; color: var(--text-secondary);">menu_book</span>
                <p style="color: var(--text-secondary); margin-top: 0.5rem;">Keine Kurse zugewiesen.</p>
            </div>`;
        return;
    }

    const courseCards = activeCourses.map(course => {
        const scheduleInfo = course.schedule
            ? course.schedule.map(s => {
                const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
                return `${dayNames[s.day]} ${s.start}-${s.end}, ${s.room}`;
            }).join('<br>')
            : 'Kein Stundenplan';

        const examInfo = course.exam
            ? `${escapeHTML(course.exam.type || 'Klausur')} am ${escapeHTML(course.exam.date)}`
            : 'Keine Prüfung geplant';

        return `
            <div class="card">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--primary-light); display: flex; align-items: center; justify-content: center;">
                        <span class="material-icons-round" style="color: var(--primary-color);">menu_book</span>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1rem;">${escapeHTML(course.name)}</h3>
                        <span style="color: var(--text-secondary); font-size: 0.85rem;">${escapeHTML(course.code)} &bull; ${escapeHTML(String(course.ects))} ECTS</span>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="material-icons-round" style="font-size: 1.1rem;">schedule</span>
                        <span>${scheduleInfo}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="material-icons-round" style="font-size: 1.1rem;">event_note</span>
                        <span>${examInfo}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="material-icons-round" style="font-size: 1.1rem;">people</span>
                        <span>${escapeHTML(course.semester)}</span>
                    </div>
                </div>
            </div>`;
    }).join('');

    const pastSection = pastCourses.length > 0 ? `
        <div style="grid-column: 1 / -1; margin-top: 1rem;">
            <h3 style="color: var(--text-secondary); margin-bottom: 0.75rem;">Vergangene Kurse</h3>
            <div class="grid-container">
                ${pastCourses.map(course => `
                    <div class="card" style="opacity: 0.7;">
                        <h4 style="margin: 0 0 0.25rem 0;">${escapeHTML(course.name)}</h4>
                        <span style="color: var(--text-secondary); font-size: 0.85rem;">${escapeHTML(course.code)} &bull; ${escapeHTML(course.semester)} &bull; ${escapeHTML(String(course.ects))} ECTS</span>
                    </div>
                `).join('')}
            </div>
        </div>` : '';

    container.innerHTML = courseCards + pastSection;
}

/**
 * Renders the calendar for dozent's active courses.
 */
function renderDozentCalendar(data, user) {
    const myCourses = data.modules.filter(m => m.dozentId === user.id && (m.status === 'active' || m.status === 'registered'));
    renderCalendarForModules(myCourses, '.dozent-calendar-grid', 'dozent-calendar-week-label');
}

/**
 * Initializes sub-tab switching within the dozent-courses section.
 */
function initDozentTabs() {
    const section = document.getElementById('dozent-courses');
    if (!section) return;
    initSectionTabs(section);
}

/**
 * Renders the Dozent's grading interface (basic placeholder).
 */
export function renderDozentGrading(data, user) {
    const container = document.querySelector('.dozent-grading-content');
    if (!container) return;

    const activeCourses = data.modules.filter(m => m.dozentId === user.id && (m.status === 'active' || m.status === 'registered'));

    if (activeCourses.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 2rem;">
                <span class="material-icons-round" style="font-size: 2.5rem; color: var(--text-secondary);">grading</span>
                <p style="color: var(--text-secondary); margin-top: 0.5rem;">Keine aktiven Kurse für die Notenvergabe.</p>
            </div>`;
        return;
    }

    container.innerHTML = activeCourses.map(course => `
        <div class="card" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0;">${escapeHTML(course.name)} (${escapeHTML(course.code)})</h3>
                <span class="exam-tag">${escapeHTML(course.exam?.type || 'Klausur')}</span>
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                Prüfungstermin: ${course.exam ? escapeHTML(course.exam.date) : 'TBA'}
                ${course.exam?.room ? ' &bull; ' + escapeHTML(course.exam.room) : ''}
            </p>
            <div style="background: var(--surface-color); border-radius: 8px; padding: 1.5rem; text-align: center; color: var(--text-secondary);">
                <span class="material-icons-round" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;">edit_note</span>
                <p>Notenvergabe wird nach der Prüfung freigeschaltet.</p>
            </div>
        </div>
    `).join('');
}
